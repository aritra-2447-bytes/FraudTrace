# =============================================================================
# TEMPORAL TRANSACTION + NETWORK ANOMALY DETECTION
# Multivariate Gaussian + Mahalanobis Distance
#
# DATA:
#   Account -> Merchant transaction network
#
# OBSERVATION:
#   One transaction event for one account.
#
# MODEL:
#   X ~ Multivariate Gaussian(mu, Sigma)
#
# SCORE:
#   D^2 = (x - mu)^T Sigma^-1 (x - mu)
#
# COVARIANCE:
#   Ledoit-Wolf shrinkage covariance
#
# THRESHOLD:
#   Unsupervised validation quantile
#
# IMPORTANT:
#   The supplied dataset has no ground-truth fraud/anomaly label.
#   Therefore F1/precision/recall cannot be used to choose the threshold.
# =============================================================================

import pickle

import numpy as np
import pandas as pd

from scipy.stats import skew, kurtosis, chi2

from sklearn.preprocessing import PowerTransformer
from sklearn.covariance import LedoitWolf

# Graph + visualization
import networkx as nx
import matplotlib.pyplot as plt


# =============================================================================
# CONFIGURATION
# =============================================================================

DATASET_PATH = "dataset.csv"

OUTPUT_PATH = "final_anomalies_output.csv"
MODEL_ARTIFACT_PATH = "gaussian_model_artifacts.pkl"

# Candidate temporal behavior windows.
WINDOWS = {
    "5m": "5min",
    "15m": "15min",
    "1h": "1h",
    "6h": "6h",
    "24h": "24h",
}

# Personal historical baseline for amount behavior.
BASELINE_WINDOW = "7D"

# Minimum historical observations required before calculating
# an account-specific amount z-score.
MIN_HISTORY = 5

# Because the dataset has no labels:
# 99th percentile means roughly the most extreme 1% of validation
# observations are flagged.
VALIDATION_QUANTILE = 0.99

# Only used to avoid division-by-zero in ratios.
EPSILON = 1e-8


# Graph outputs
GRAPH_GEXF_PATH = "transaction_network_full.gexf"
GRAPH_PNG_PATH = "transaction_network_full.png"
ANOMALY_GRAPH_PNG_PATH = "anomalous_account_networks.png"

# Typology thresholds.
# These are heuristic behavioral rules, NOT ground-truth fraud labels.
AMOUNT_Z_TYPLOGY_THRESHOLD = 3.0
BURST_RATIO_TYPLOGY_THRESHOLD = 0.60
NETWORK_EXPANSION_TYPOLOGY_THRESHOLD = 0.50
NEW_ENTITY_MIN_COUNT = 1
BURST_RATIO_TYPOLOGY_THRESHOLD = 0.60


REQUIRED_COLUMNS = [
    "TransactionID",
    "AccountID",
    "TransactionAmount",
    "TransactionDate",
    "MerchantID",
]


# =============================================================================
# PHASE 1
# DATA VALIDATION
# =============================================================================

def validate_and_prepare_data(df):
    """
    Validate schema, clean basic fields, remove exact duplicates,
    and sort chronologically.

    No learned parameters are estimated here.
    """

    print("\n" + "=" * 80)
    print("PHASE 1: DATA VALIDATION")
    print("=" * 80)

    df = df.copy()

    # -------------------------------------------------------------------------
    # Required columns
    # -------------------------------------------------------------------------

    missing_columns = [
        col for col in REQUIRED_COLUMNS
        if col not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    print(f"Initial shape: {df.shape}")

    # -------------------------------------------------------------------------
    # Timestamp
    # -------------------------------------------------------------------------

    df["TransactionDate"] = pd.to_datetime(
        df["TransactionDate"],
        errors="coerce"
    )

    invalid_dates = df["TransactionDate"].isna().sum()

    if invalid_dates > 0:
        print(
            f"Removing {invalid_dates} rows with invalid timestamps."
        )

    df = df.dropna(
        subset=["TransactionDate"]
    )

    # -------------------------------------------------------------------------
    # Transaction amount
    # -------------------------------------------------------------------------

    df["TransactionAmount"] = pd.to_numeric(
        df["TransactionAmount"],
        errors="coerce"
    )

    invalid_amounts = df["TransactionAmount"].isna().sum()

    if invalid_amounts > 0:
        print(
            f"Removing {invalid_amounts} rows with invalid amounts."
        )

    df = df.dropna(
        subset=["TransactionAmount"]
    )

    print(
        "Negative transaction amounts:",
        int((df["TransactionAmount"] < 0).sum())
    )

    # -------------------------------------------------------------------------
    # Required entity identifiers
    # -------------------------------------------------------------------------

    required_entity_columns = [
        "TransactionID",
        "AccountID",
        "MerchantID",
    ]

    before = len(df)

    df = df.dropna(
        subset=required_entity_columns
    )

    removed = before - len(df)

    if removed:
        print(
            f"Removed {removed} rows with missing identifiers."
        )

    # -------------------------------------------------------------------------
    # Exact duplicates
    # -------------------------------------------------------------------------

    duplicate_count = int(
        df.duplicated().sum()
    )

    print(
        f"Exact duplicate rows: {duplicate_count}"
    )

    if duplicate_count > 0:
        df = df.drop_duplicates()

    # -------------------------------------------------------------------------
    # Sort chronologically
    # -------------------------------------------------------------------------

    df = (
        df.sort_values(
            ["TransactionDate", "TransactionID"]
        )
        .reset_index(drop=True)
    )

    # -------------------------------------------------------------------------
    # Summary
    # -------------------------------------------------------------------------

    print(
        f"Final shape: {df.shape}"
    )

    print(
        f"Time range: "
        f"{df['TransactionDate'].min()} "
        f"-> "
        f"{df['TransactionDate'].max()}"
    )

    print(
        f"Unique accounts: "
        f"{df['AccountID'].nunique()}"
    )

    print(
        f"Unique merchants: "
        f"{df['MerchantID'].nunique()}"
    )

    if "DeviceID" in df.columns:
        print(
            f"Unique devices: "
            f"{df['DeviceID'].nunique()}"
        )

    if "IP Address" in df.columns:
        print(
            f"Unique IPs: "
            f"{df['IP Address'].nunique()}"
        )

    return df


# =============================================================================
# PHASE 2
# TEMPORAL TRAIN / VALIDATION / TEST SPLIT
# =============================================================================

def split_temporally(df):
    """
    Chronological split:

        earliest 70% -> TRAIN
        next 15%     -> VALIDATION
        latest 15%   -> TEST

    No random shuffling.
    """

    print("\n" + "=" * 80)
    print("PHASE 2: TEMPORAL SPLIT")
    print("=" * 80)

    df = (
        df.sort_values(
            ["TransactionDate", "TransactionID"]
        )
        .reset_index(drop=True)
    )

    n = len(df)

    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train = df.iloc[:train_end].copy()
    val = df.iloc[train_end:val_end].copy()
    test = df.iloc[val_end:].copy()

    print(
        f"TRAIN: {len(train)} rows | "
        f"{train['TransactionDate'].min()} "
        f"-> "
        f"{train['TransactionDate'].max()}"
    )

    print(
        f"VALIDATION: {len(val)} rows | "
        f"{val['TransactionDate'].min()} "
        f"-> "
        f"{val['TransactionDate'].max()}"
    )

    print(
        f"TEST: {len(test)} rows | "
        f"{test['TransactionDate'].min()} "
        f"-> "
        f"{test['TransactionDate'].max()}"
    )

    return train, val, test


# =============================================================================
# PHASE 3
# HISTORICAL ACCOUNT FEATURES
# =============================================================================

def add_historical_features(df):
    """
    Calculate account-specific historical behavior.

    Important:
        Every historical quantity is based on information before
        the current transaction.

    Main outputs:
        - hours_since_last_txn
        - history_count
        - amount_z_score_7d
        - is_first_txn
    """

    df = (
        df.copy()
        .sort_values(
            ["AccountID", "TransactionDate", "TransactionID"]
        )
        .reset_index(drop=True)
    )

    # -------------------------------------------------------------------------
    # Previous transaction timestamp
    # -------------------------------------------------------------------------

    df["prev_transaction_time"] = (
        df.groupby("AccountID")["TransactionDate"]
        .shift(1)
    )

    df["hours_since_last_txn"] = (
        df["TransactionDate"]
        - df["prev_transaction_time"]
    ).dt.total_seconds() / 3600.0

    df["is_first_txn"] = (
        df["prev_transaction_time"].isna()
    ).astype(int)

    # -------------------------------------------------------------------------
    # Historical transaction count
    # -------------------------------------------------------------------------

    df["history_count"] = (
        df.groupby("AccountID")
        .cumcount()
    )

    # -------------------------------------------------------------------------
    # Previous amount
    # -------------------------------------------------------------------------

    df["prev_amount"] = (
        df.groupby("AccountID")["TransactionAmount"]
        .shift(1)
    )

    # -------------------------------------------------------------------------
    # Account-specific 7-day amount baseline
    #
    # IMPORTANT:
    # closed="left" excludes the current timestamp.
    # Therefore the current transaction cannot influence its own baseline.
    # -------------------------------------------------------------------------

    historical_mean = np.full(
        len(df),
        np.nan,
        dtype=float
    )

    historical_std = np.full(
        len(df),
        np.nan,
        dtype=float
    )

    for _, idx in df.groupby(
        "AccountID",
        sort=False
    ).groups.items():

        idx = np.asarray(idx)

        sub = df.loc[idx].sort_values(
            ["TransactionDate", "TransactionID"]
        )

        amount_series = pd.Series(
            sub["prev_amount"].to_numpy(),
            index=pd.DatetimeIndex(
                sub["TransactionDate"]
            )
        )

        rolling_mean = (
            amount_series
            .rolling(
                BASELINE_WINDOW,
                closed="left",
                min_periods=MIN_HISTORY
            )
            .mean()
        )

        rolling_std = (
            amount_series
            .rolling(
                BASELINE_WINDOW,
                closed="left",
                min_periods=MIN_HISTORY
            )
            .std()
        )

        positions = sub.index.to_numpy()

        historical_mean[positions] = (
            rolling_mean.to_numpy()
        )

        historical_std[positions] = (
            rolling_std.to_numpy()
        )

    df["hist_mean_amount_7d"] = historical_mean
    df["hist_std_amount_7d"] = historical_std

    # -------------------------------------------------------------------------
    # Account-specific amount z-score
    # -------------------------------------------------------------------------

    valid = (
        (df["history_count"] >= MIN_HISTORY)
        &
        np.isfinite(df["hist_mean_amount_7d"])
        &
        np.isfinite(df["hist_std_amount_7d"])
        &
        (df["hist_std_amount_7d"] > EPSILON)
    )

    df["amount_z_score_7d"] = np.nan

    df.loc[valid, "amount_z_score_7d"] = (
        (
            df.loc[
                valid,
                "TransactionAmount"
            ]
            -
            df.loc[
                valid,
                "hist_mean_amount_7d"
            ]
        )
        /
        df.loc[
            valid,
            "hist_std_amount_7d"
        ]
    )

    # Prevent pathological personal z-scores from dominating the feature space.
    df["amount_z_score_7d"] = (
        df["amount_z_score_7d"]
        .clip(-20, 20)
    )

    return df


# =============================================================================
# PHASE 4
# ROLLING TEMPORAL FEATURES
# =============================================================================

def add_rolling_features(df):
    """
    Calculate strictly historical rolling features.

    Windows:
        5 minutes
        15 minutes
        1 hour
        6 hours
        24 hours

    The current transaction is excluded.

    Observation is transaction-triggered:
        each transaction gets a feature vector describing the
        recent context immediately before it.
    """

    print("\n" + "=" * 80)
    print("PHASE 4: ROLLING TEMPORAL FEATURES")
    print("=" * 80)

    df = (
        df.copy()
        .sort_values(
            ["AccountID", "TransactionDate", "TransactionID"]
        )
        .reset_index(drop=True)
    )

    for name, window in WINDOWS.items():

        amount_sum = np.zeros(
            len(df),
            dtype=float
        )

        transaction_count = np.zeros(
            len(df),
            dtype=float
        )

        for _, idx in df.groupby(
            "AccountID",
            sort=False
        ).groups.items():

            idx = np.asarray(idx)

            sub = df.loc[idx].sort_values(
                ["TransactionDate", "TransactionID"]
            )

            timestamp_index = pd.DatetimeIndex(
                sub["TransactionDate"]
            )

            amounts = pd.Series(
                sub["TransactionAmount"].to_numpy(),
                index=timestamp_index
            )

            events = pd.Series(
                np.ones(len(sub)),
                index=timestamp_index
            )

            rolling_amount = (
                amounts
                .rolling(
                    window,
                    closed="left",
                    min_periods=1
                )
                .sum()
                .fillna(0.0)
            )

            rolling_count = (
                events
                .rolling(
                    window,
                    closed="left",
                    min_periods=1
                )
                .sum()
                .fillna(0.0)
            )

            positions = sub.index.to_numpy()

            amount_sum[positions] = (
                rolling_amount.to_numpy()
            )

            transaction_count[positions] = (
                rolling_count.to_numpy()
            )

        df[f"amount_sum_{name}"] = amount_sum
        df[f"txn_count_{name}"] = transaction_count

        hours = max(
            pd.Timedelta(window).total_seconds()
            / 3600.0,
            EPSILON
        )

        df[f"txn_velocity_{name}"] = (
            df[f"txn_count_{name}"]
            / hours
        )

        df[f"amount_velocity_{name}"] = (
            df[f"amount_sum_{name}"]
            / hours
        )

    # -------------------------------------------------------------------------
    # Burst ratio
    #
    # Fraction of the previous 1-hour transaction count that occurred
    # during the previous 5 minutes.
    # -------------------------------------------------------------------------

    df["burst_ratio_5m_1h"] = (
        df["txn_count_5m"]
        /
        (
            df["txn_count_1h"]
            + EPSILON
        )
    )

    df["burst_ratio_5m_1h"] = (
        df["burst_ratio_5m_1h"]
        .clip(0, 1)
    )

    return df


# =============================================================================
# PHASE 5
# NETWORK / ENTITY FEATURES
# =============================================================================

def add_network_features(df):
    """
    Your dataset supports an ACCOUNT -> MERCHANT bipartite graph.

    Therefore:

        degree = unique merchants connected to an account
                 in the selected time window.

    We do NOT pretend this is an account -> account transfer graph.

    Additional entity novelty features:
        - new merchant
        - new device
        - new IP
        - new location
        - historical unique devices
    """

    print("\n" + "=" * 80)
    print("PHASE 5: NETWORK / ENTITY FEATURES")
    print("=" * 80)

    df = (
        df.copy()
        .sort_values(
            ["AccountID", "TransactionDate", "TransactionID"]
        )
        .reset_index(drop=True)
    )

    # -------------------------------------------------------------------------
    # New merchant
    # -------------------------------------------------------------------------

    df["is_new_merchant"] = (
        ~df.duplicated(
            ["AccountID", "MerchantID"],
            keep="first"
        )
    ).astype(int)

    # -------------------------------------------------------------------------
    # Device novelty + historical unique devices
    # -------------------------------------------------------------------------

    if "DeviceID" in df.columns:

        df["is_new_device"] = (
            ~df.duplicated(
                ["AccountID", "DeviceID"],
                keep="first"
            )
        ).astype(int)

        historical_device_count = np.zeros(
            len(df),
            dtype=float
        )

        for _, idx in df.groupby(
            "AccountID",
            sort=False
        ).groups.items():

            idx = np.asarray(idx)

            sub = df.loc[idx].sort_values(
                ["TransactionDate", "TransactionID"]
            )

            seen_devices = set()
            result = []

            for device in sub["DeviceID"]:

                result.append(
                    len(seen_devices)
                )

                if pd.notna(device):
                    seen_devices.add(device)

            historical_device_count[
                sub.index.to_numpy()
            ] = result

        df["hist_unique_devices"] = (
            historical_device_count
        )

    else:

        df["is_new_device"] = 0
        df["hist_unique_devices"] = np.nan

    # -------------------------------------------------------------------------
    # IP novelty
    # -------------------------------------------------------------------------

    if "IP Address" in df.columns:

        df["is_new_ip"] = (
            ~df.duplicated(
                ["AccountID", "IP Address"],
                keep="first"
            )
        ).astype(int)

    else:

        df["is_new_ip"] = 0

    # -------------------------------------------------------------------------
    # Location novelty
    # -------------------------------------------------------------------------

    if "Location" in df.columns:

        df["is_new_location"] = (
            ~df.duplicated(
                ["AccountID", "Location"],
                keep="first"
            )
        ).astype(int)

    else:

        df["is_new_location"] = 0

    # -------------------------------------------------------------------------
    # Rolling account -> merchant degree
    #
    # Degree = number of unique merchants interacted with in the window.
    #
    # Current transaction is excluded.
    # -------------------------------------------------------------------------

    for name, window in WINDOWS.items():

        degree = np.zeros(
            len(df),
            dtype=float
        )

        window_delta = pd.Timedelta(
            window
        )

        for _, idx in df.groupby(
            "AccountID",
            sort=False
        ).groups.items():

            idx = np.asarray(idx)

            sub = df.loc[idx].sort_values(
                ["TransactionDate", "TransactionID"]
            )

            times = (
                sub["TransactionDate"]
                .to_numpy(
                    dtype="datetime64[ns]"
                )
            )

            merchants = (
                sub["MerchantID"]
                .to_numpy()
            )

            left = 0
            right = 0

            merchant_counts = {}
            result = np.zeros(
                len(sub),
                dtype=float
            )

            for i in range(len(sub)):

                current_time = pd.Timestamp(
                    times[i]
                )

                lower_bound = (
                    current_time
                    - window_delta
                )

                # Add only transactions strictly before
                # the current timestamp.
                while (
                    right < i
                    and
                    pd.Timestamp(times[right])
                    < current_time
                ):

                    merchant = merchants[right]

                    merchant_counts[merchant] = (
                        merchant_counts.get(
                            merchant,
                            0
                        )
                        + 1
                    )

                    right += 1

                # Remove transactions outside the window.
                while (
                    left < right
                    and
                    pd.Timestamp(times[left])
                    < lower_bound
                ):

                    merchant = merchants[left]

                    merchant_counts[merchant] -= 1

                    if merchant_counts[merchant] <= 0:
                        del merchant_counts[merchant]

                    left += 1

                result[i] = len(
                    merchant_counts
                )

            degree[
                sub.index.to_numpy()
            ] = result

        df[f"degree_{name}"] = degree

    # -------------------------------------------------------------------------
    # Recent network expansion.
    #
    # What fraction of the account's recent 24h merchant network
    # is represented by the previous 5m?
    # -------------------------------------------------------------------------

    df["network_expansion_ratio"] = (
        df["degree_5m"]
        /
        (
            df["degree_24h"]
            + EPSILON
        )
    )

    df["network_expansion_ratio"] = (
        df["network_expansion_ratio"]
        .clip(0, 1)
    )

    return df


# =============================================================================
# PHASE 6
# CANDIDATE GAUSSIAN FEATURES
# =============================================================================

def get_candidate_features(df):
    """
    Continuous features only.

    Binary flags are intentionally NOT passed into the
    multivariate Gaussian.
    """

    candidates = [

        # ---------------------------------------------------------------------
        # Transaction amount
        # ---------------------------------------------------------------------

        "TransactionAmount",

        # ---------------------------------------------------------------------
        # Temporal activity
        # ---------------------------------------------------------------------

        "txn_count_5m",
        "txn_count_1h",
        "txn_count_24h",

        "amount_sum_5m",
        "amount_sum_1h",
        "amount_sum_24h",

        "hours_since_last_txn",

        "burst_ratio_5m_1h",

        # ---------------------------------------------------------------------
        # Personal historical deviation
        # ---------------------------------------------------------------------

        "amount_z_score_7d",

        # ---------------------------------------------------------------------
        # Network structure
        # ---------------------------------------------------------------------

        "degree_5m",
        "degree_1h",
        "degree_24h",

        # ---------------------------------------------------------------------
        # Entity/network history
        # ---------------------------------------------------------------------

        "hist_unique_devices",

        "network_expansion_ratio",
    ]

    available = [
        feature
        for feature in candidates
        if feature in df.columns
    ]

    print("\nCandidate Gaussian features:")

    for feature in available:
        print(f"  - {feature}")

    return available


# =============================================================================
# PHASE 7
# FEATURE CLEANING
# =============================================================================

def clean_feature_matrix(
    train_df,
    val_df,
    test_df,
    features
):
    """
    All feature-cleaning decisions are based on TRAIN only.

    Missing values in validation/test are filled with TRAIN medians.
    """

    print("\n" + "=" * 80)
    print("PHASE 7: FEATURE CLEANING")
    print("=" * 80)

    train = train_df.copy()
    val = val_df.copy()
    test = test_df.copy()

    valid_features = []

    # -------------------------------------------------------------------------
    # Identify usable features from TRAIN.
    # -------------------------------------------------------------------------

    for feature in features:

        values = (
            pd.to_numeric(
                train[feature],
                errors="coerce"
            )
            .replace(
                [np.inf, -np.inf],
                np.nan
            )
        )

        finite_values = (
            values.dropna()
        )

        if len(finite_values) < 2:

            print(
                f"Dropping {feature}: "
                "insufficient finite training values."
            )

            continue

        if finite_values.std() <= EPSILON:

            print(
                f"Dropping {feature}: "
                "zero/near-zero training variance."
            )

            continue

        valid_features.append(
            feature
        )

    # -------------------------------------------------------------------------
    # TRAIN median imputation
    # -------------------------------------------------------------------------

    final_features = []

    for feature in valid_features:

        median = train[feature].median()

        if pd.isna(median):

            print(
                f"Dropping {feature}: "
                "training median is NaN."
            )

            continue

        for frame in (
            train,
            val,
            test
        ):

            frame[feature] = (
                pd.to_numeric(
                    frame[feature],
                    errors="coerce"
                )
                .replace(
                    [np.inf, -np.inf],
                    np.nan
                )
                .fillna(median)
            )

        final_features.append(
            feature
        )

    print("\nUsable features:")

    for feature in final_features:
        print(
            f"  - {feature}"
        )

    return (
        train,
        val,
        test,
        final_features
    )


# =============================================================================
# PHASE 8
# REMOVE EXACT DUPLICATE FEATURES
# =============================================================================

def remove_exact_duplicate_features(
    train_df,
    val_df,
    test_df,
    features
):
    """
    Remove mathematically identical features.

    Example:
        degree_1h == unique_merchants_1h

    We don't want two columns carrying exactly the same information.
    """

    print("\n" + "=" * 80)
    print("PHASE 8: EXACT DUPLICATE FEATURE CHECK")
    print("=" * 80)

    keep = []
    dropped = []

    for feature in features:

        is_duplicate = False

        for existing in keep:

            same = np.array_equal(
                train_df[feature].to_numpy(),
                train_df[existing].to_numpy(),
                equal_nan=True
            )

            if same:

                dropped.append(
                    (
                        feature,
                        existing
                    )
                )

                is_duplicate = True
                break

        if not is_duplicate:
            keep.append(
                feature
            )

    if dropped:

        print(
            "Exact duplicate features removed:"
        )

        for duplicate, original in dropped:

            print(
                f"  {duplicate} == {original}"
            )

    else:

        print(
            "No exact duplicate features found."
        )

    return keep


# =============================================================================
# PHASE 9
# TRAIN-ONLY YEO-JOHNSON TRANSFORMATION
# =============================================================================

def fit_transform_features(
    train_df,
    val_df,
    test_df,
    features
):
    """
    Fit Yeo-Johnson ONLY on TRAIN.

    The learned transformation is then applied to VALIDATION/TEST.

    This prevents preprocessing leakage.
    """

    print("\n" + "=" * 80)
    print("PHASE 9: TRAIN-ONLY YEO-JOHNSON")
    print("=" * 80)

    transformer = PowerTransformer(
        method="yeo-johnson",
        standardize=True
    )

    X_train_raw = (
        train_df[features]
        .to_numpy(dtype=float)
    )

    X_val_raw = (
        val_df[features]
        .to_numpy(dtype=float)
    )

    X_test_raw = (
        test_df[features]
        .to_numpy(dtype=float)
    )

    # -------------------------------------------------------------------------
    # Fit ONLY on TRAIN
    # -------------------------------------------------------------------------

    X_train = transformer.fit_transform(
        X_train_raw
    )

    X_val = transformer.transform(
        X_val_raw
    )

    X_test = transformer.transform(
        X_test_raw
    )

    transformed_features = [
        f"{feature}_yj"
        for feature in features
    ]

    train = train_df.copy()
    val = val_df.copy()
    test = test_df.copy()

    train[
        transformed_features
    ] = X_train

    val[
        transformed_features
    ] = X_val

    test[
        transformed_features
    ] = X_test

    # -------------------------------------------------------------------------
    # Training diagnostics
    # -------------------------------------------------------------------------

    print(
        "\nTRAIN transformed distribution diagnostics:"
    )

    for i, feature in enumerate(features):

        values = X_train[:, i]

        print(
            f"{feature:30s}"
            f" skew={skew(values):8.3f}"
            f" kurtosis={kurtosis(values):8.3f}"
        )

    return (
        train,
        val,
        test,
        transformed_features,
        transformer
    )


# =============================================================================
# PHASE 10
# CORRELATION ANALYSIS
# =============================================================================

def analyze_correlations(
    train_df,
    transformed_features
):
    """
    Correlation is analyzed using TRAIN only.

    Pearson:
        linear association

    Spearman:
        monotonic association
    """

    print("\n" + "=" * 80)
    print("PHASE 10: CORRELATION ANALYSIS")
    print("=" * 80)

    pearson = (
        train_df[
            transformed_features
        ]
        .corr(
            method="pearson"
        )
    )

    spearman = (
        train_df[
            transformed_features
        ]
        .corr(
            method="spearman"
        )
    )

    print(
        "\nHighly correlated Pearson pairs "
        "(|r| >= 0.90):"
    )

    found = False

    columns = list(
        pearson.columns
    )

    for i in range(
        len(columns)
    ):

        for j in range(i):

            value = pearson.iloc[
                i,
                j
            ]

            if abs(value) >= 0.90:

                print(
                    f"  {columns[i]} <-> "
                    f"{columns[j]}: "
                    f"{value:.3f}"
                )

                found = True

    if not found:

        print(
            "  None found."
        )

    return (
        pearson,
        spearman
    )


# =============================================================================
# PHASE 11
# FIT MULTIVARIATE GAUSSIAN
# =============================================================================

def fit_gaussian(
    train_df,
    features
):
    """
    Fit:

        X ~ N(mu, Sigma)

    using normal/mostly-normal TRAIN data.

    Ledoit-Wolf gives a shrinkage covariance estimate that is
    more numerically stable than a raw sample covariance matrix
    when features are correlated.
    """

    print("\n" + "=" * 80)
    print("PHASE 11: MULTIVARIATE GAUSSIAN")
    print("=" * 80)

    X = (
        train_df[
            features
        ]
        .to_numpy(dtype=float)
    )

    # -------------------------------------------------------------------------
    # Number of observations vs features
    # -------------------------------------------------------------------------

    print(
        f"Training observations: {len(X)}"
    )

    print(
        f"Gaussian features: {len(features)}"
    )

    if len(X) <= len(features):

        raise ValueError(
            "Training observations must be substantially "
            "greater than the number of Gaussian features."
        )

    # -------------------------------------------------------------------------
    # Mean vector
    # -------------------------------------------------------------------------

    mu = X.mean(
        axis=0
    )

    # -------------------------------------------------------------------------
    # Ledoit-Wolf covariance
    # -------------------------------------------------------------------------

    covariance_model = (
        LedoitWolf()
        .fit(X)
    )

    Sigma = (
        covariance_model
        .covariance_
    )

    precision = (
        covariance_model
        .precision_
    )

    # -------------------------------------------------------------------------
    # Covariance diagnostics
    # -------------------------------------------------------------------------

    eigenvalues = np.linalg.eigvalsh(
        Sigma
    )

    min_eigenvalue = (
        eigenvalues.min()
    )

    max_eigenvalue = (
        eigenvalues.max()
    )

    condition_number = (
        max_eigenvalue
        /
        max(
            min_eigenvalue,
            EPSILON
        )
    )

    print(
        f"Ledoit-Wolf shrinkage: "
        f"{covariance_model.shrinkage_:.6f}"
    )

    print(
        f"Minimum covariance eigenvalue: "
        f"{min_eigenvalue:.8e}"
    )

    print(
        f"Maximum covariance eigenvalue: "
        f"{max_eigenvalue:.8e}"
    )

    print(
        f"Covariance condition number: "
        f"{condition_number:.4e}"
    )

    return (
        mu,
        Sigma,
        precision,
        covariance_model
    )


# =============================================================================
# PHASE 12
# MAHALANOBIS DISTANCE
# =============================================================================

def calculate_mahalanobis(
    df,
    features,
    mu,
    precision
):
    """
    Squared Mahalanobis distance:

        D² = (x-mu)^T Sigma^-1 (x-mu)

    Larger D² = further from learned normal distribution.
    """

    X = (
        df[
            features
        ]
        .to_numpy(dtype=float)
    )

    delta = (
        X - mu
    )

    scores = np.einsum(
        "ij,jk,ik->i",
        delta,
        precision,
        delta
    )

    # Protect against tiny negative floating-point values.
    scores = np.maximum(
        scores,
        0.0
    )

    return scores


# =============================================================================
# PHASE 13
# UNSUPERVISED THRESHOLD
# =============================================================================

def select_unsupervised_threshold(
    validation_scores
):
    """
    There are no anomaly labels.

    Therefore F1/precision/recall cannot select the threshold.

    We use the upper tail of the VALIDATION score distribution.

    The operational default is the 99th percentile.
    """

    print("\n" + "=" * 80)
    print("PHASE 13: UNSUPERVISED THRESHOLD")
    print("=" * 80)

    candidate_quantiles = [
        0.990,
        0.995,
        0.999,
    ]

    thresholds = {}

    for q in candidate_quantiles:

        threshold = np.quantile(
            validation_scores,
            q
        )

        thresholds[q] = threshold

        print(
            f"{q * 100:.1f}th percentile: "
            f"{threshold:.6f}"
        )

    threshold = thresholds[
        VALIDATION_QUANTILE
    ]

    print(
        f"\nSelected threshold: "
        f"{threshold:.6f}"
    )

    print(
        "Interpretation: validation observations above this "
        "threshold are considered extreme."
    )

    return (
        threshold,
        thresholds
    )


# =============================================================================
# PHASE 14
# THEORETICAL CHI-SQUARE REFERENCE
# =============================================================================

def chi_square_reference(
    number_of_features
):
    """
    If the true data distribution were exactly multivariate Gaussian
    and the parameters were known, Mahalanobis D² would approximately
    follow Chi-square(df=d).

    This is a diagnostic/reference only.
    """

    reference_99 = chi2.ppf(
        0.99,
        df=number_of_features
    )

    reference_995 = chi2.ppf(
        0.995,
        df=number_of_features
    )

    print("\nTheoretical Gaussian reference:")
    print(
        f"  degrees of freedom = "
        f"{number_of_features}"
    )

    print(
        f"  Chi-square 99% D²  = "
        f"{reference_99:.4f}"
    )

    print(
        f"  Chi-square 99.5% D² = "
        f"{reference_995:.4f}"
    )

    return (
        reference_99,
        reference_995
    )


# =============================================================================
# PHASE 15
# SUPPORTING ANOMALY SIGNALS
# =============================================================================

def explain_anomaly(
    row,
    features,
    mu,
    Sigma,
    precision
):
    """
    Supporting signals for an anomalous observation.

    IMPORTANT:
        These are NOT causal explanations.

    The multivariate anomaly comes from the entire vector and
    covariance structure.

    The contribution term:

        delta_i * (Sigma^-1 delta)_i

    sums to the squared Mahalanobis distance.

    Individual contributions can be negative because of correlations.
    """

    x = (
        row[
            features
        ]
        .to_numpy(dtype=float)
    )

    delta = (
        x - mu
    )

    precision_delta = (
        precision @ delta
    )

    contributions = (
        delta
        *
        precision_delta
    )

    # Rank by absolute contribution.
    ranking = np.argsort(
        np.abs(contributions)
    )[::-1]

    signals = []

    for index in ranking:

        if len(signals) >= 4:
            break

        contribution = (
            contributions[index]
        )

        if abs(contribution) < 0.10:
            continue

        feature_name = (
            features[index]
            .replace(
                "_yj",
                ""
            )
        )

        signals.append(
            f"{feature_name}: "
            f"D² contribution={contribution:.2f}"
        )

    # -------------------------------------------------------------------------
    # Non-Gaussian supporting indicators
    # -------------------------------------------------------------------------

    if row.get(
        "is_new_merchant",
        0
    ) == 1:

        signals.append(
            "new_merchant"
        )

    if row.get(
        "is_new_device",
        0
    ) == 1:

        signals.append(
            "new_device"
        )

    if row.get(
        "is_new_ip",
        0
    ) == 1:

        signals.append(
            "new_IP"
        )

    if row.get(
        "is_new_location",
        0
    ) == 1:

        signals.append(
            "new_location"
        )

    if not signals:

        return (
            "Multivariate combination anomaly"
        )

    return " | ".join(
        signals[:8]
    )



# =============================================================================
# PHASE 16
# BEHAVIORAL TYPOLOGY ENGINE
# =============================================================================

def classify_anomaly_type(row):
    """
    Assign a behavioral anomaly hypothesis to a statistically anomalous
    observation.

    IMPORTANT:
        The dataset is unlabelled. These are heuristic typology labels,
        NOT verified fraud labels.

    Supported hypotheses:
        - SMURFING_LIKE
        - MULE_LIKE
        - ATO_LIKE
        - BURST_ACTIVITY
        - AMOUNT_ANOMALY
        - NETWORK_EXPANSION
        - ENTITY_NOVELTY
        - MULTI_SIGNAL_ANOMALY
        - STATISTICAL_ANOMALY
        - NORMAL
    """

    if int(row.get("is_anomaly", 0)) != 1:
        return "NORMAL"

    reasons = []

    # -------------------------------------------------------------------------
    # Amount anomaly
    # -------------------------------------------------------------------------
    amount_z = row.get("amount_z_score_7d", np.nan)

    if pd.notna(amount_z) and abs(float(amount_z)) >= AMOUNT_Z_TYPLOGY_THRESHOLD:
        reasons.append("AMOUNT_ANOMALY")

    # -------------------------------------------------------------------------
    # Burst activity
    # -------------------------------------------------------------------------
    burst_ratio = row.get("burst_ratio_5m_1h", np.nan)

    if (
        pd.notna(burst_ratio)
        and float(burst_ratio) >= BURST_RATIO_TYPOLOGY_THRESHOLD
    ):
        reasons.append("BURST_ACTIVITY")

    # -------------------------------------------------------------------------
    # Network expansion
    # -------------------------------------------------------------------------
    network_ratio = row.get(
        "network_expansion_ratio",
        np.nan
    )

    if (
        pd.notna(network_ratio)
        and float(network_ratio) >= NETWORK_EXPANSION_TYPOLOGY_THRESHOLD
    ):
        reasons.append("NETWORK_EXPANSION")

    # -------------------------------------------------------------------------
    # Entity novelty
    # -------------------------------------------------------------------------
    entity_novelty = 0

    for col in [
        "is_new_merchant",
        "is_new_device",
        "is_new_ip",
        "is_new_location",
    ]:
        entity_novelty += int(row.get(col, 0))

    if entity_novelty >= NEW_ENTITY_MIN_COUNT:
        reasons.append("ENTITY_NOVELTY")

    # -------------------------------------------------------------------------
    # ATO-like behavior
    #
    # We cannot verify account takeover with this dataset because there is
    # no ground-truth takeover label and no direct authentication/session
    # history. Instead, detect the combination:
    #
    #   anomaly + new device/IP/location + behavioral deviation.
    # -------------------------------------------------------------------------
    takeover_signal_count = (
        int(row.get("is_new_device", 0))
        + int(row.get("is_new_ip", 0))
        + int(row.get("is_new_location", 0))
    )

    if (
        takeover_signal_count >= 1
        and (
            (pd.notna(amount_z) and abs(float(amount_z)) >= 2.5)
            or (
                pd.notna(burst_ratio)
                and float(burst_ratio) >= 0.50
            )
        )
    ):
        reasons.append("ATO_LIKE")

    # -------------------------------------------------------------------------
    # Smurfing-like behavior
    #
    # Classic smurfing usually requires many source accounts feeding one
    # receiving account. Our dataset is Account -> Merchant, so classic
    # account-to-account smurfing cannot be proven.
    #
    # We therefore use a conservative "fan-out smurfing-like" hypothesis:
    # unusually rapid expansion across many merchants.
    # -------------------------------------------------------------------------
    degree_5m = row.get("degree_5m", np.nan)
    degree_1h = row.get("degree_1h", np.nan)

    if (
        pd.notna(degree_5m)
        and pd.notna(degree_1h)
        and float(degree_5m) >= 3
        and float(degree_5m) >= 0.50 * max(float(degree_1h), 1.0)
    ):
        reasons.append("SMURFING_LIKE")

    # -------------------------------------------------------------------------
    # Mule-like behavior
    #
    # True mule detection normally needs sender/receiver account flow,
    # especially incoming/outgoing money relationships. We do not have that.
    #
    # We therefore use a conservative "mule-like transit/activity" hypothesis
    # only when there is both abnormal velocity and unusually broad merchant
    # connectivity.
    # -------------------------------------------------------------------------
    txn_1h = row.get("txn_count_1h", np.nan)
    degree_1h_value = row.get("degree_1h", np.nan)

    if (
        pd.notna(txn_1h)
        and pd.notna(degree_1h_value)
        and float(txn_1h) >= 5
        and float(degree_1h_value) >= 3
    ):
        reasons.append("MULE_LIKE")

    # -------------------------------------------------------------------------
    # Prioritize typologies
    # -------------------------------------------------------------------------
    priority = [
        "ATO_LIKE",
        "SMURFING_LIKE",
        "MULE_LIKE",
        "AMOUNT_ANOMALY",
        "BURST_ACTIVITY",
        "NETWORK_EXPANSION",
        "ENTITY_NOVELTY",
    ]

    for label in priority:
        if label in reasons:
            return label

    if len(reasons) >= 2:
        return "MULTI_SIGNAL_ANOMALY"

    if reasons:
        return reasons[0]

    return "STATISTICAL_ANOMALY"


def build_typology_evidence(row):
    """
    Build a human-readable explanation of the heuristic typology signals.
    """

    if int(row.get("is_anomaly", 0)) != 1:
        return "No anomaly flagged"

    evidence = []

    amount_z = row.get("amount_z_score_7d", np.nan)

    if pd.notna(amount_z):
        if abs(float(amount_z)) >= AMOUNT_Z_TYPLOGY_THRESHOLD:
            evidence.append(
                f"amount deviation |z|={abs(float(amount_z)):.2f}"
            )

    burst = row.get("burst_ratio_5m_1h", np.nan)

    if (
        pd.notna(burst)
        and float(burst) >= BURST_RATIO_TYPOLOGY_THRESHOLD
    ):
        evidence.append(
            f"high burst ratio={float(burst):.2f}"
        )

    degree_5m = row.get("degree_5m", np.nan)
    degree_1h = row.get("degree_1h", np.nan)

    if (
        pd.notna(degree_5m)
        and pd.notna(degree_1h)
    ):
        if (
            float(degree_5m) >= 3
            and float(degree_5m)
            >= 0.50 * max(float(degree_1h), 1.0)
        ):
            evidence.append(
                f"rapid merchant expansion: "
                f"{int(degree_5m)} merchants/5m"
            )

    if int(row.get("is_new_device", 0)) == 1:
        evidence.append("new device")

    if int(row.get("is_new_ip", 0)) == 1:
        evidence.append("new IP")

    if int(row.get("is_new_location", 0)) == 1:
        evidence.append("new location")

    if int(row.get("is_new_merchant", 0)) == 1:
        evidence.append("new merchant")

    if not evidence:
        return "Statistically unusual multivariate combination"

    return " | ".join(evidence)


# =============================================================================
# PHASE 17
# TRANSACTION GRAPH CONSTRUCTION
# =============================================================================

def build_transaction_graph(
    df,
    start_time=None,
    end_time=None
):
    """
    Build the Account -> Merchant bipartite transaction graph.

    Nodes:
        account nodes
        merchant nodes

    Edge attributes:
        transaction_count
        total_amount
        first_transaction
        last_transaction

    This creates the actual graph object rather than merely deriving
    degree features.
    """

    graph_df = df.copy()

    if start_time is not None:
        graph_df = graph_df[
            graph_df["TransactionDate"] >= pd.Timestamp(start_time)
        ]

    if end_time is not None:
        graph_df = graph_df[
            graph_df["TransactionDate"] <= pd.Timestamp(end_time)
        ]

    G = nx.Graph()

    # Add every account and merchant as a node.
    for account in graph_df["AccountID"].dropna().unique():
        G.add_node(
            f"account::{account}",
            node_type="account",
            original_id=str(account)
        )

    for merchant in graph_df["MerchantID"].dropna().unique():
        G.add_node(
            f"merchant::{merchant}",
            node_type="merchant",
            original_id=str(merchant)
        )

    # Aggregate transactions between account and merchant.
    grouped = (
        graph_df
        .groupby(
            ["AccountID", "MerchantID"],
            dropna=False
        )
        .agg(
            transaction_count=(
                "TransactionID",
                "count"
            ),
            total_amount=(
                "TransactionAmount",
                "sum"
            ),
            first_transaction=(
                "TransactionDate",
                "min"
            ),
            last_transaction=(
                "TransactionDate",
                "max"
            ),
        )
        .reset_index()
    )

    for _, row in grouped.iterrows():

        account_node = (
            f"account::{row['AccountID']}"
        )

        merchant_node = (
            f"merchant::{row['MerchantID']}"
        )

        G.add_edge(
            account_node,
            merchant_node,
            transaction_count=int(
                row["transaction_count"]
            ),
            total_amount=float(
                row["total_amount"]
            ),
            first_transaction=str(
                row["first_transaction"]
            ),
            last_transaction=str(
                row["last_transaction"]
            ),
        )

    return G


def attach_account_anomaly_attributes(
    G,
    anomaly_df
):
    """
    Attach anomaly information to account nodes.

    If an account has multiple anomalous observations, the most severe
    observed anomaly is retained.
    """

    account_summary = (
        anomaly_df
        .groupby("AccountID")
        .agg(
            max_anomaly_score=(
                "anomaly_score",
                "max"
            ),
            anomaly_count=(
                "is_anomaly",
                "sum"
            ),
        )
        .reset_index()
    )

    # Highest scoring anomaly type for each account.
    idx = (
        anomaly_df
        .groupby("AccountID")["anomaly_score"]
        .idxmax()
    )

    type_summary = anomaly_df.loc[
        idx,
        [
            "AccountID",
            "anomaly_type"
        ]
    ]

    type_summary = type_summary.rename(
        columns={
            "anomaly_type": "dominant_anomaly_type"
        }
    )

    account_summary = account_summary.merge(
        type_summary,
        on="AccountID",
        how="left"
    )

    for _, row in account_summary.iterrows():

        node = (
            f"account::{row['AccountID']}"
        )

        if node not in G:
            continue

        anomaly_count = int(
            row["anomaly_count"]
        )

        is_anomaly = (
            anomaly_count > 0
        )

        G.nodes[node][
            "is_anomaly"
        ] = int(is_anomaly)

        G.nodes[node][
            "anomaly_count"
        ] = anomaly_count

        G.nodes[node][
            "max_anomaly_score"
        ] = float(
            row["max_anomaly_score"]
        )

        G.nodes[node][
            "dominant_anomaly_type"
        ] = (
            str(
                row["dominant_anomaly_type"]
            )
            if is_anomaly
            else "NORMAL"
        )

    # Accounts that never appear in anomaly_df.
    for node, attrs in G.nodes(data=True):

        if attrs.get("node_type") != "account":
            continue

        if "is_anomaly" not in attrs:

            G.nodes[node][
                "is_anomaly"
            ] = 0

            G.nodes[node][
                "anomaly_count"
            ] = 0

            G.nodes[node][
                "max_anomaly_score"
            ] = 0.0

            G.nodes[node][
                "dominant_anomaly_type"
            ] = "NORMAL"

    return G


# =============================================================================
# PHASE 18
# GRAPH EXPORT + VISUALIZATION
# =============================================================================

def visualize_full_graph(
    G,
    output_path
):
    """
    Draw every account and merchant node in the graph.

    For very large graphs, the figure may become dense. In that case
    the GEXF export remains the authoritative full graph representation.
    """

    print("\nGenerating full transaction network visualization...")

    if len(G) == 0:
        print("Graph is empty. Skipping visualization.")
        return

    plt.figure(
        figsize=(20, 16)
    )

    # Reproducible layout.
    pos = nx.spring_layout(
        G,
        seed=42,
        k=None
    )

    account_nodes = [
        node
        for node, attrs in G.nodes(data=True)
        if attrs.get("node_type") == "account"
    ]

    merchant_nodes = [
        node
        for node, attrs in G.nodes(data=True)
        if attrs.get("node_type") == "merchant"
    ]

    normal_accounts = [
        node
        for node in account_nodes
        if G.nodes[node].get("is_anomaly", 0) == 0
    ]

    anomalous_accounts = [
        node
        for node in account_nodes
        if G.nodes[node].get("is_anomaly", 0) == 1
    ]

    # Node sizes.
    normal_sizes = [
        60 + 20 * G.degree(node)
        for node in normal_accounts
    ]

    anomalous_sizes = [
        250 + 50 * G.degree(node)
        for node in anomalous_accounts
    ]

    merchant_sizes = [
        50 + 10 * G.degree(node)
        for node in merchant_nodes
    ]

    nx.draw_networkx_nodes(
        G,
        pos,
        nodelist=normal_accounts,
        node_color="skyblue",
        node_size=normal_sizes,
        alpha=0.65,
        node_shape="o",
        label="Normal account"
    )

    nx.draw_networkx_nodes(
        G,
        pos,
        nodelist=anomalous_accounts,
        node_color="red",
        node_size=anomalous_sizes,
        alpha=0.95,
        node_shape="o",
        label="Anomalous account"
    )

    nx.draw_networkx_nodes(
        G,
        pos,
        nodelist=merchant_nodes,
        node_color="lightgray",
        node_size=merchant_sizes,
        alpha=0.60,
        node_shape="s",
        label="Merchant"
    )

    # Edge widths based on transaction count.
    widths = [
        0.5 + 0.4 * np.log1p(
            G.edges[e].get(
                "transaction_count",
                1
            )
        )
        for e in G.edges
    ]

    nx.draw_networkx_edges(
        G,
        pos,
        width=widths,
        alpha=0.25
    )

    # Labels for anomalous accounts and all merchants only if graph is small.
    labels = {}

    for node in anomalous_accounts:
        labels[node] = (
            G.nodes[node].get(
                "original_id",
                node
            )
            + "\n"
            + G.nodes[node].get(
                "dominant_anomaly_type",
                "ANOMALY"
            )
        )

    if len(G) <= 120:
        for node in merchant_nodes:
            labels[node] = (
                G.nodes[node].get(
                    "original_id",
                    node
                )
            )

    nx.draw_networkx_labels(
        G,
        pos,
        labels=labels,
        font_size=7
    )

    plt.title(
        "Full Account–Merchant Transaction Network"
    )

    plt.legend(
        loc="best"
    )

    plt.axis("off")

    plt.tight_layout()

    plt.savefig(
        output_path,
        dpi=250,
        bbox_inches="tight"
    )

    plt.close()

    print(
        f"Full network visualization saved to: "
        f"{output_path}"
    )


def visualize_anomalous_ego_networks(
    G,
    anomaly_df,
    output_path,
    max_accounts=12
):
    """
    Produce a readable visualization of the highest-scoring anomalous
    account neighborhoods.

    The full graph is still preserved in GEXF; this view is for human
    interpretation/presentation.
    """

    anomalous_accounts = (
        anomaly_df[
            anomaly_df["is_anomaly"] == 1
        ]
        .sort_values(
            "anomaly_score",
            ascending=False
        )["AccountID"]
        .drop_duplicates()
        .head(max_accounts)
        .tolist()
    )

    if not anomalous_accounts:
        print(
            "No anomalous accounts found for ego-network visualization."
        )
        return

    subgraphs = []

    for account in anomalous_accounts:

        node = f"account::{account}"

        if node not in G:
            continue

        ego_nodes = (
            set(
                nx.ego_graph(
                    G,
                    node,
                    radius=1
                ).nodes()
            )
        )

        subgraphs.append(
            G.subgraph(
                ego_nodes
            ).copy()
        )

    if not subgraphs:
        return

    n = len(subgraphs)

    cols = 3
    rows = int(
        np.ceil(n / cols)
    )

    fig, axes = plt.subplots(
        rows,
        cols,
        figsize=(18, 5 * rows)
    )

    axes = np.atleast_1d(
        axes
    ).flatten()

    for ax, subgraph in zip(
        axes,
        subgraphs
    ):

        pos = nx.spring_layout(
            subgraph,
            seed=42
        )

        account_nodes = [
            node
            for node, attrs
            in subgraph.nodes(data=True)
            if attrs.get("node_type") == "account"
        ]

        merchant_nodes = [
            node
            for node, attrs
            in subgraph.nodes(data=True)
            if attrs.get("node_type") == "merchant"
        ]

        nx.draw_networkx_nodes(
            subgraph,
            pos,
            nodelist=merchant_nodes,
            node_color="lightgray",
            node_shape="s",
            node_size=250,
            alpha=0.75,
            ax=ax
        )

        nx.draw_networkx_nodes(
            subgraph,
            pos,
            nodelist=account_nodes,
            node_color="red",
            node_shape="o",
            node_size=650,
            alpha=0.9,
            ax=ax
        )

        nx.draw_networkx_edges(
            subgraph,
            pos,
            alpha=0.5,
            ax=ax
        )

        labels = {}

        for node in subgraph.nodes:

            attrs = subgraph.nodes[node]

            if attrs.get("node_type") == "account":

                labels[node] = (
                    attrs.get(
                        "original_id",
                        node
                    )
                    + "\n"
                    + attrs.get(
                        "dominant_anomaly_type",
                        "ANOMALY"
                    )
                )

            else:

                labels[node] = attrs.get(
                    "original_id",
                    node
                )

        nx.draw_networkx_labels(
            subgraph,
            pos,
            labels=labels,
            font_size=7,
            ax=ax
        )

        account_node = next(
            (
                node
                for node in subgraph.nodes
                if str(node).startswith(
                    "account::"
                )
                and subgraph.nodes[node].get(
                    "is_anomaly",
                    0
                ) == 1
            ),
            None
        )

        if account_node is not None:

            account_id = subgraph.nodes[
                account_node
            ].get(
                "original_id"
            )

            anomaly_type = subgraph.nodes[
                account_node
            ].get(
                "dominant_anomaly_type",
                "ANOMALY"
            )

            ax.set_title(
                f"Account {account_id} | {anomaly_type}"
            )

        ax.axis("off")

    # Hide unused axes.
    for ax in axes[len(subgraphs):]:
        ax.axis("off")

    fig.suptitle(
        "Top Anomalous Account–Merchant Neighborhoods",
        fontsize=16
    )

    plt.tight_layout()

    plt.savefig(
        output_path,
        dpi=250,
        bbox_inches="tight"
    )

    plt.close()

    print(
        f"Anomalous ego-network visualization saved to: "
        f"{output_path}"
    )


def save_graph(
    G,
    output_path
):
    """
    Save the full graph in GEXF format.

    GEXF can be opened in Gephi for interactive exploration.
    """

    nx.write_gexf(
        G,
        output_path
    )

    print(
        f"Full graph exported to: "
        f"{output_path}"
    )


# =============================================================================
# PHASE 19
# APPLY TYPOLOGY + GRAPH MODULES
# =============================================================================

def add_typology_and_graph_modules(
    final_output,
    full_engineered_df
):
    """
    Add:

        anomaly_type
        typology_evidence

    Build:

        full Account -> Merchant graph

    Attach:

        anomaly attributes to account nodes

    Export:

        GEXF full graph
        full PNG graph
        anomalous ego-network PNG
    """

    print("\n" + "=" * 80)
    print("PHASE 19: ANOMALY TYPOLOGY + GRAPH ANALYSIS")
    print("=" * 80)

    result = final_output.copy()

    # -------------------------------------------------------------------------
    # Typology labels
    # -------------------------------------------------------------------------

    result["anomaly_type"] = (
        result.apply(
            classify_anomaly_type,
            axis=1
        )
    )

    result["typology_evidence"] = (
        result.apply(
            build_typology_evidence,
            axis=1
        )
    )

    # -------------------------------------------------------------------------
    # Build full historical graph.
    #
    # This is a presentation/structural graph over the full dataset.
    # The Gaussian model itself remains temporally evaluated.
    # -------------------------------------------------------------------------

    G = build_transaction_graph(
        full_engineered_df
    )

    # Attach account anomaly information from TEST + historical flags.
    G = attach_account_anomaly_attributes(
        G,
        result
    )

    # -------------------------------------------------------------------------
    # Export graph.
    # -------------------------------------------------------------------------

    save_graph(
        G,
        GRAPH_GEXF_PATH
    )

    visualize_full_graph(
        G,
        GRAPH_PNG_PATH
    )

    visualize_anomalous_ego_networks(
        G,
        result,
        ANOMALY_GRAPH_PNG_PATH
    )

    return (
        result,
        G
    )



# =============================================================================
# PHASE 16
# MAIN PIPELINE
# =============================================================================

def main():

    print("\n")
    print("=" * 80)
    print("TEMPORAL TRANSACTION-NETWORK ANOMALY DETECTION")
    print("MULTIVARIATE GAUSSIAN + MAHALANOBIS DISTANCE")
    print("=" * 80)

    # =========================================================================
    # LOAD
    # =========================================================================

    print("\nLoading dataset...")

    raw_df = pd.read_csv(
        DATASET_PATH
    )

    # =========================================================================
    # VALIDATE
    # =========================================================================

    df = (
        validate_and_prepare_data(
            raw_df
        )
    )

    # =========================================================================
    # FEATURE ENGINEERING
    #
    # IMPORTANT:
    #
    # We engineer the ENTIRE timeline once.
    #
    # This is safe because every feature at time t only uses information
    # available before t.
    #
    # The learned preprocessing and Gaussian parameters are still fitted
    # ONLY using TRAIN data.
    #
    # This lets validation/test observations inherit their legitimate
    # historical state from earlier periods.
    # =========================================================================

    print(
        "\nEngineering complete chronological history..."
    )

    df = add_historical_features(
        df
    )

    df = add_rolling_features(
        df
    )

    df = add_network_features(
        df
    )

    # =========================================================================
    # TEMPORAL SPLIT
    # =========================================================================

    train_raw, val_raw, test_raw = (
        split_temporally(
            df
        )
    )

    # =========================================================================
    # CANDIDATE FEATURES
    # =========================================================================

    candidates = (
        get_candidate_features(
            train_raw
        )
    )

    # =========================================================================
    # CLEAN FEATURES
    # =========================================================================

    (
        train,
        val,
        test,
        usable_features
    ) = clean_feature_matrix(
        train_raw,
        val_raw,
        test_raw,
        candidates
    )

    # =========================================================================
    # REMOVE EXACT DUPLICATES
    # =========================================================================

    usable_features = (
        remove_exact_duplicate_features(
            train,
            val,
            test,
            usable_features
        )
    )

    if len(usable_features) < 2:

        raise RuntimeError(
            "Fewer than two usable Gaussian features remain."
        )

    # =========================================================================
    # TRAIN-ONLY YEO-JOHNSON
    # =========================================================================

    (
        train,
        val,
        test,
        gaussian_features,
        transformer
    ) = fit_transform_features(
        train,
        val,
        test,
        usable_features
    )

    # =========================================================================
    # CORRELATION ANALYSIS
    # =========================================================================

    (
        pearson,
        spearman
    ) = analyze_correlations(
        train,
        gaussian_features
    )

    # =========================================================================
    # FIT MULTIVARIATE GAUSSIAN
    # =========================================================================

    (
        mu,
        Sigma,
        precision,
        covariance_model
    ) = fit_gaussian(
        train,
        gaussian_features
    )

    # =========================================================================
    # THEORETICAL REFERENCE
    # =========================================================================

    (
        chi2_99,
        chi2_995
    ) = chi_square_reference(
        len(gaussian_features)
    )

    # =========================================================================
    # SCORE TRAIN / VALIDATION / TEST
    # =========================================================================

    print("\n" + "=" * 80)
    print("PHASE 12: MAHALANOBIS SCORING")
    print("=" * 80)

    train["anomaly_score"] = (
        calculate_mahalanobis(
            train,
            gaussian_features,
            mu,
            precision
        )
    )

    val["anomaly_score"] = (
        calculate_mahalanobis(
            val,
            gaussian_features,
            mu,
            precision
        )
    )

    test["anomaly_score"] = (
        calculate_mahalanobis(
            test,
            gaussian_features,
            mu,
            precision
        )
    )

    print(
        f"TRAIN median D²: "
        f"{train['anomaly_score'].median():.4f}"
    )

    print(
        f"VALIDATION median D²: "
        f"{val['anomaly_score'].median():.4f}"
    )

    print(
        f"TEST median D²: "
        f"{test['anomaly_score'].median():.4f}"
    )

    # =========================================================================
    # THRESHOLD
    # =========================================================================

    (
        threshold,
        candidate_thresholds
    ) = select_unsupervised_threshold(
        val["anomaly_score"].to_numpy()
    )

    # =========================================================================
    # FLAG ANOMALIES
    # =========================================================================

    for frame, split_name in (
        (train, "Train"),
        (val, "Validation"),
        (test, "Test"),
    ):

        frame["split_tag"] = (
            split_name
        )

        frame["is_anomaly"] = (
            frame["anomaly_score"]
            >
            threshold
        ).astype(int)

        frame["supporting_signals"] = ""

        anomaly_mask = (
            frame["is_anomaly"] == 1
        )

        if anomaly_mask.any():

            frame.loc[
                anomaly_mask,
                "supporting_signals"
            ] = frame.loc[
                anomaly_mask
            ].apply(
                lambda row:
                explain_anomaly(
                    row,
                    gaussian_features,
                    mu,
                    Sigma,
                    precision
                ),
                axis=1
            )

    # =========================================================================
    # COMBINE OUTPUT
    # =========================================================================

    final_output = (
        pd.concat(
            [
                train,
                val,
                test
            ],
            ignore_index=True
        )
        .sort_values(
            [
                "TransactionDate",
                "TransactionID"
            ]
        )
    )

    output_columns = [
        "TransactionID",
        "AccountID",
        "TransactionDate",
        "TransactionAmount",
        "MerchantID",
        "split_tag",
        "anomaly_score",
        "is_anomaly",
        "supporting_signals",
    ]

    optional_columns = [
        "TransactionType",
        "Location",
        "DeviceID",
        "IP Address",
    ]

    for column in optional_columns:

        if column in final_output.columns:

            output_columns.append(
                column
            )

    final_output = final_output[
        output_columns
    ].copy()

    # =========================================================================
    # TYPOLOGY + GRAPH MODULES
    # =========================================================================

    final_output, transaction_graph = (
        add_typology_and_graph_modules(
            final_output,
            df
        )
    )

    # Add anomaly-type columns to the final CSV.
    output_columns.extend(
        [
            "anomaly_type",
            "typology_evidence",
        ]
    )

    final_output = final_output[
        [
            col
            for col in output_columns
            if col in final_output.columns
        ]
    ].copy()

    # =========================================================================
    # SAVE OUTPUT
    # =========================================================================

    final_output.to_csv(
        OUTPUT_PATH,
        index=False
    )

    # =========================================================================
    # SAVE MODEL ARTIFACTS
    # =========================================================================

    artifacts = {

        "model_type":
            "Multivariate Gaussian anomaly detector",

        "score_type":
            "Squared Mahalanobis distance",

        "gaussian_features":
            gaussian_features,

        "mean_vector":
            mu,

        "covariance_matrix":
            Sigma,

        "precision_matrix":
            precision,

        "covariance_method":
            "Ledoit-Wolf",

        "covariance_shrinkage":
            covariance_model.shrinkage_,

        "transformer":
            transformer,

        "validation_quantile":
            VALIDATION_QUANTILE,

        "threshold":
            threshold,

        "candidate_thresholds":
            candidate_thresholds,

        "windows":
            WINDOWS,

        "baseline_window":
            BASELINE_WINDOW,

        "minimum_history":
            MIN_HISTORY,

        "pearson_correlation":
            pearson,

        "spearman_correlation":
            spearman,

        "chi_square_99_reference":
            chi2_99,

        "chi_square_995_reference":
            chi2_995,

        "typology_thresholds":
            {
                "amount_z":
                    AMOUNT_Z_TYPLOGY_THRESHOLD,
                "burst_ratio":
                    BURST_RATIO_TYPOLOGY_THRESHOLD,
                "network_expansion_ratio":
                    NETWORK_EXPANSION_TYPOLOGY_THRESHOLD,
                "new_entity_min_count":
                    NEW_ENTITY_MIN_COUNT,
            },

        "graph_type":
            "Account-Merchant bipartite graph",

        "graph_gexf_path":
            GRAPH_GEXF_PATH,

        "graph_visualization_path":
            GRAPH_PNG_PATH,

        "anomalous_ego_graph_path":
            ANOMALY_GRAPH_PNG_PATH,
    }

    with open(
        MODEL_ARTIFACT_PATH,
        "wb"
    ) as file:

        pickle.dump(
            artifacts,
            file
        )

    # =========================================================================
    # RESULTS
    # =========================================================================

    test_anomalies = int(
        test["is_anomaly"].sum()
    )

    print("\n" + "=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)

    print(
        f"TRAIN observations: "
        f"{len(train)}"
    )

    print(
        f"VALIDATION observations: "
        f"{len(val)}"
    )

    print(
        f"TEST observations: "
        f"{len(test)}"
    )

    print(
        f"TEST anomalies flagged: "
        f"{test_anomalies}"
    )

    print(
        f"TEST anomaly rate: "
        f"{test_anomalies / max(len(test), 1):.4%}"
    )

    print(
        f"Output saved to: "
        f"{OUTPUT_PATH}"
    )

    print(
        f"Model artifacts saved to: "
        f"{MODEL_ARTIFACT_PATH}"
    )

    # =========================================================================
    # TOP ANOMALIES
    # =========================================================================

    print("\n" + "=" * 80)
    print("TOP 20 TEST ANOMALIES")
    print("=" * 80)

    top_anomalies = (
        final_output[
            final_output["split_tag"] == "Test"
        ]
        .nlargest(
            20,
            "anomaly_score"
        )
    )

    print(
        top_anomalies[
            [
                "TransactionID",
                "AccountID",
                "TransactionDate",
                "TransactionAmount",
                "anomaly_score",
                "is_anomaly",
                "supporting_signals",
            ]
        ].to_string(
            index=False
        )
    )

    print("\nPIPELINE COMPLETE.")


# =============================================================================
# RUN
# =============================================================================

if __name__ == "__main__":
    main()
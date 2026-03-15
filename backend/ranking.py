import pandas as pd
from sklearn.preprocessing import MinMaxScaler


def rank_materials(df):

    scaler = MinMaxScaler()

    df[['norm_co2']] = scaler.fit_transform(
        df[['predicted_co2']]
    )

    df["score"] = (
        0.5 * (1 - df["norm_co2"]) +
        0.3 * (df["Biodegradability Score (1-10)"] / 10) +
        0.2 * (df["Recyclability (%)"] / 100)
    )

    # Sort highest sustainability first
    df = df.sort_values(by="score", ascending=False)

    # Keep only best configuration for each material
    df = df.groupby("Material_Type").first().reset_index()

    return df.head(5)
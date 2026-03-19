import pandas as pd
from sklearn.preprocessing import MinMaxScaler


def rank_materials(df):

    scaler = MinMaxScaler()

    df["norm_co2"] = scaler.fit_transform(df[["predicted_co2"]])
    df["norm_bio"] = scaler.fit_transform(df[["Biodegradability Score (1-10)"]])
    df["norm_rec"] = scaler.fit_transform(df[["Recyclability (%)"]])

    df["score"] = (
        0.5 * (1 - df["norm_co2"]) +
        0.3 * df["norm_bio"] +
        0.2 * df["norm_rec"]
    )

    df = df.sort_values(by="score", ascending=False)

    df = df.drop_duplicates(subset=["Material_Type"])

    # Keep best configuration per material
    # df = df.loc[df.groupby("Material_Type")["score"].idxmax()]

    return df.head(3)
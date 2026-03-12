import pandas as pd
from sklearn.preprocessing import MinMaxScaler

def rank_materials(df):

    scaler = MinMaxScaler()

    # Normalize CO2 because lower CO2 is better
    df[['norm_co2']] = scaler.fit_transform(
        df[['predicted_co2']]
    )

    df["score"] = (
        0.5 * (1 - df["norm_co2"]) +
        0.3 * (df["Biodegradability Score (1-10)"] / 10) +
        0.2 * (df["Recyclability (%)"] / 100)
    )

    df = df.sort_values(by="score", ascending=False)

    return df.head(5)
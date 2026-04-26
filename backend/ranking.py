from sklearn.preprocessing import MinMaxScaler

def rank_materials(df):

    scaler = MinMaxScaler()

    df["norm_co2"] = scaler.fit_transform(df[["predicted_co2"]])
    df["norm_bio"] = scaler.fit_transform(df[["Biodegradability Score (1-10)"]])
    df["norm_rec"] = scaler.fit_transform(df[["Recyclability (%)"]])

    # Weighted explainable components
    df["co2_score"] = ((1 - df["norm_co2"]) * 0.5).clip(0, 1)
    df["bio_score"] = (df["norm_bio"] * 0.3).clip(0, 1)
    df["rec_score"] = (df["norm_rec"] * 0.2).clip(0, 1)

    df["sustainability_score"] = (
        df["co2_score"] +
        df["bio_score"] +
        df["rec_score"]
    )

    df["final_score"] = (
        0.55 * df["sustainability_score"] +
        0.45 * df["compatibility"]
    ).clip(0, 1)

    df = df.sort_values(by="final_score", ascending=False)

    df = df.loc[df.groupby("Material_Type")["final_score"].idxmax()]

    return df.head(3)
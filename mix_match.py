import sys, json, librosa, numpy as np

def analyze(file_path):
    y, sr = librosa.load(file_path, sr=None)
    S = np.abs(librosa.stft(y))
    spectral_centroid = librosa.feature.spectral_centroid(S=S, sr=sr).mean()
    spectral_bandwidth = librosa.feature.spectral_bandwidth(S=S, sr=sr).mean()
    rms = librosa.feature.rms(y=y).mean()
    return {
        "centroid": float(spectral_centroid),
        "bandwidth": float(spectral_bandwidth),
        "rms": float(rms)
    }

if __name__ == "__main__":
    args = json.loads(sys.argv[1])
    ref = analyze(args["refPath"])
    mine = analyze(args["myPath"])

    diff_centroid = mine["centroid"] - ref["centroid"]
    diff_bandwidth = mine["bandwidth"] - ref["bandwidth"]
    diff_rms = mine["rms"] - ref["rms"]

    advice = []
    if diff_centroid > 500:
        advice.append("Your mix is brighter than the reference (reduce highs).")
    elif diff_centroid < -500:
        advice.append("Your mix is darker than the reference (boost highs).")

    if diff_bandwidth > 500:
        advice.append("Your mix has more spread (check stereo imaging).")
    elif diff_bandwidth < -500:
        advice.append("Your mix is narrower (consider widening).")

    if diff_rms > 0.02:
        advice.append("Your track is louder/denser (reduce compression/volume).")
    elif diff_rms < -0.02:
        advice.append("Your track is quieter/thinner (add compression/volume).")

    print(json.dumps({
        "reference": ref,
        "mine": mine,
        "advice": advice
    }))

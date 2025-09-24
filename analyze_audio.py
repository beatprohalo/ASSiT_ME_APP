import sys, json, librosa

def analyze_file(file_path):
    try:
        y, sr = librosa.load(file_path, sr=None)
        
        # Estimate tempo (BPM)
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

        # Estimate key
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key = chroma.mean(axis=1).argmax()

        # Crude mood detection: energy vs. chill
        rms = librosa.feature.rms(y=y).mean()
        mood = "energetic" if rms > 0.02 else "chill"

        return {
            "file": file_path,
            "tempo": round(float(tempo), 2),
            "key_index": int(key),
            "mood": mood
        }
    except Exception as e:
        return {"file": file_path, "error": str(e)}

if __name__ == "__main__":
    files = json.loads(sys.argv[1])
    results = [analyze_file(f) for f in files]
    print(json.dumps(results))

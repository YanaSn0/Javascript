from fastapi import FastAPI, Query
from transformers import pipeline

app = FastAPI()
classifier = pipeline("zero-shot-image-classification", model="openai/clip-vit-base-patch32")

SEX_LABELS = ["male", "female"]
RACE_LABELS = ["white", "black", "latino", "asian", "indian", "middle eastern", "mixed", "indigenous", "pacific islander"]
OBJECT_LABELS = ["gun", "knife", "coin", "phone", "computer", "car", "rocket", "mask", "helmet", "glasses", "hat", "suit", "tie", "chain", "crown"]
CLOTHING_LABELS = ["hoodie", "suit", "tactical gear", "casual", "uniform"]
SCENE_LABELS = ["urban", "rural", "indoor", "outdoor", "night", "day"]

def best_label(result, threshold=0.4):
    return result[0] if result[0]["score"] >= threshold else {"label": "unknown", "score": result[0]["score"]}

def object_likelihood(sex, race, clothing, scene):
    score = 0.0
    if sex == "male": score += 0.2
    if race in ["black", "latino", "middle eastern"]: score += 0.1  # dataset bias
    if clothing in ["tactical gear", "hoodie"]: score += 0.3
    if scene in ["urban", "night"]: score += 0.2
    return score

@app.get("/classify")
def classify(url: str):
    try:
        sex = best_label(classifier(url, candidate_labels=SEX_LABELS))
        race = best_label(classifier(url, candidate_labels=RACE_LABELS))
        clothing = best_label(classifier(url, candidate_labels=CLOTHING_LABELS))
        scene = best_label(classifier(url, candidate_labels=SCENE_LABELS))
        object_ = best_label(classifier(url, candidate_labels=OBJECT_LABELS))

        # Contextual filter
        likelihood = object_likelihood(sex["label"], race["label"], clothing["label"], scene["label"])
        show_object = object_ if (object_["score"] >= 0.4 and likelihood >= 0.5) else {"label": "unknown", "score": 0.0}

        return {
            "sex": sex,
            "race": race,
            "clothing": clothing,
            "scene": scene,
            "object": show_object
        }
    except Exception as e:
        return {"error": str(e)}

import base64
import binascii
import os
from functools import lru_cache
from typing import Dict, List

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ultralytics import YOLO


class AnalyzeFrameRequest(BaseModel):
    image_data_url: str = Field(..., description="Image as data URL: data:image/jpeg;base64,...")
    method: str = Field(default="REBA")


class HealthResponse(BaseModel):
    status: str
    model: str


app = FastAPI(title="BiomeCheck API", version="0.2.0")

allowed_origins_env = os.getenv(
    "ALLOWED_ORIGINS",
    "http://127.0.0.1:8787,http://localhost:8787,http://127.0.0.1:8080,http://localhost:8080",
)
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@lru_cache(maxsize=1)
def get_model() -> YOLO:
    model_name = os.getenv("YOLO_MODEL", "yolo11n-pose.pt")
    return YOLO(model_name)


def decode_data_url(data_url: str) -> np.ndarray:
    if "," not in data_url:
        raise HTTPException(status_code=400, detail="Invalid image_data_url format")

    _, encoded = data_url.split(",", 1)
    try:
        raw = base64.b64decode(encoded)
    except (ValueError, binascii.Error) as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 image payload") from exc

    arr = np.frombuffer(raw, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image")
    return image


def angle_between(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> int:
    ab = a - b
    cb = c - b
    mag_ab = float(np.linalg.norm(ab))
    mag_cb = float(np.linalg.norm(cb))
    if mag_ab == 0.0 or mag_cb == 0.0:
        return 0
    cos_value = float(np.dot(ab, cb) / (mag_ab * mag_cb))
    cos_value = max(-1.0, min(1.0, cos_value))
    return int(round(np.degrees(np.arccos(cos_value))))


def vertical_angle(a: np.ndarray, b: np.ndarray) -> int:
    dx = float(b[0] - a[0])
    dy = float(b[1] - a[1])
    return int(round(np.degrees(np.arctan2(abs(dx), abs(dy)))))


def neck_reba(deg: int) -> int:
    if deg <= 10:
        return 1
    if deg <= 20:
        return 2
    return 3


def trunk_reba(deg: int) -> int:
    if deg <= 5:
        return 1
    if deg <= 20:
        return 2
    if deg <= 60:
        return 3
    return 4


def upper_arm_reba(deg: int) -> int:
    if deg <= 20:
        return 1
    if deg <= 45:
        return 2
    if deg <= 90:
        return 3
    return 4


def lower_arm_reba(deg: int) -> int:
    return 1 if 60 <= deg <= 100 else 2


def table_a(trunk: int, neck: int, leg: int) -> int:
    table = [
        [[1, 2, 3, 4], [1, 2, 3, 4], [3, 3, 5, 6]],
        [[2, 3, 4, 5], [3, 4, 5, 6], [4, 5, 6, 7]],
        [[2, 4, 5, 6], [4, 5, 6, 7], [5, 6, 7, 8]],
        [[3, 5, 6, 7], [5, 6, 7, 8], [6, 7, 8, 9]],
        [[4, 6, 7, 8], [6, 7, 8, 9], [7, 8, 9, 9]],
    ]
    t = min(max(trunk - 1, 0), 4)
    n = min(max(neck - 1, 0), 2)
    l = min(max(leg - 1, 0), 3)
    return table[t][n][l]


def table_b(upper: int, lower: int, wrist: int) -> int:
    table = [
        [[1, 2, 2], [1, 2, 3]],
        [[1, 2, 3], [2, 3, 4]],
        [[3, 4, 5], [4, 5, 5]],
        [[4, 5, 5], [5, 6, 7]],
        [[6, 7, 8], [7, 8, 8]],
        [[7, 8, 8], [8, 9, 9]],
    ]
    u = min(max(upper - 1, 0), 5)
    l = min(max(lower - 1, 0), 1)
    w = min(max(wrist - 1, 0), 2)
    return table[u][l][w]


def table_c(a_score: int, b_score: int) -> int:
    table = [
        [1, 1, 1, 2, 3, 3, 4, 5, 6, 7, 7, 7],
        [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 7, 8],
        [2, 3, 3, 3, 4, 5, 6, 7, 7, 8, 8, 8],
        [3, 4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9],
        [4, 4, 4, 5, 6, 7, 8, 8, 9, 9, 9, 9],
        [6, 6, 6, 7, 8, 8, 9, 9, 10, 10, 10, 10],
        [7, 7, 7, 8, 9, 9, 9, 10, 10, 11, 11, 11],
        [8, 8, 8, 9, 10, 10, 10, 10, 10, 11, 11, 11],
        [9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12],
        [10, 10, 10, 11, 11, 11, 11, 12, 12, 12, 12, 12],
        [11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 12],
        [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
    ]
    ai = min(max(a_score - 1, 0), 11)
    bi = min(max(b_score - 1, 0), 11)
    return table[ai][bi]


def risk_level(score: int) -> Dict[str, str]:
    if score == 1:
        return {"label": "Inapreciable", "color": "#00e5b4", "code": "negligible"}
    if score <= 3:
        return {"label": "Bajo — Puede necesitar cambios", "color": "#00e5b4", "code": "low"}
    if score <= 7:
        return {"label": "Medio — Investigar y cambiar pronto", "color": "#ffb347", "code": "medium"}
    if score <= 10:
        return {"label": "Alto — Cambios necesarios urgentes", "color": "#ff4d6d", "code": "high"}
    return {"label": "Muy alto — Implementar cambios YA", "color": "#ff4d6d", "code": "very-high"}


def compute_angles_from_keypoints(person_kp: np.ndarray) -> Dict[str, int]:
    # Ultralytics pose uses COCO keypoint order.
    nose = person_kp[0]
    l_shoulder = person_kp[5]
    r_shoulder = person_kp[6]
    l_elbow = person_kp[7]
    r_elbow = person_kp[8]
    l_wrist = person_kp[9]
    r_wrist = person_kp[10]
    l_hip = person_kp[11]
    r_hip = person_kp[12]
    l_knee = person_kp[13]
    r_knee = person_kp[14]
    l_ankle = person_kp[15]
    r_ankle = person_kp[16]

    mid_shoulder = (l_shoulder + r_shoulder) / 2.0
    mid_hip = (l_hip + r_hip) / 2.0

    return {
        "neck": vertical_angle(mid_shoulder, nose),
        "trunk": vertical_angle(mid_hip, mid_shoulder),
        "armR": angle_between(r_shoulder, r_elbow, r_wrist),
        "armL": angle_between(l_shoulder, l_elbow, l_wrist),
        "kneeR": angle_between(r_hip, r_knee, r_ankle),
        "kneeL": angle_between(l_hip, l_knee, l_ankle),
        "elbowR": angle_between(r_shoulder, r_elbow, r_wrist),
        "elbowL": angle_between(l_shoulder, l_elbow, l_wrist),
    }


def score_reba(angles: Dict[str, int]) -> Dict[str, object]:
    neck_score = neck_reba(angles["neck"])
    trunk_score = trunk_reba(angles["trunk"])
    leg_score = 1

    score_a = table_a(trunk_score, neck_score, leg_score)

    upper_arm = upper_arm_reba(180 - angles["armR"])
    lower_arm = lower_arm_reba(angles["elbowR"])
    wrist_score = 1

    score_b = table_b(upper_arm, lower_arm, wrist_score)
    score_c = table_c(score_a, score_b)
    final_score = score_c + 1

    level = risk_level(final_score)
    return {
        "score": final_score,
        "level": level["label"],
        "color": level["color"],
        "group": {"neck": neck_score, "trunk": trunk_score, "leg": leg_score},
        "tableA": score_a,
        "tableB": score_b,
        "scoreC": score_c,
    }


def detect_primary_pose(image_bgr: np.ndarray) -> np.ndarray:
    model = get_model()
    results = model.predict(source=image_bgr, conf=0.25, verbose=False)
    if not results:
        raise HTTPException(status_code=422, detail="No pose results")

    keypoints = results[0].keypoints
    if keypoints is None or keypoints.xy is None or len(keypoints.xy) == 0:
        raise HTTPException(status_code=422, detail="No person detected")

    person = keypoints.xy[0]
    return person.cpu().numpy()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    model_name = os.getenv("YOLO_MODEL", "yolo11n-pose.pt")
    return HealthResponse(status="ok", model=model_name)


@app.post("/api/pose/analyze-frame")
def analyze_frame(payload: AnalyzeFrameRequest) -> Dict[str, object]:
    image = decode_data_url(payload.image_data_url)
    keypoints = detect_primary_pose(image)
    angles = compute_angles_from_keypoints(keypoints)

    # REBA only in current backend integration; frontend may keep method switch for UI.
    score = score_reba(angles)

    compact_keypoints: List[List[float]] = [[float(x), float(y)] for x, y in keypoints.tolist()]

    return {
        "method": "REBA",
        "angles": angles,
        "score": score,
        "keypoints": compact_keypoints,
    }

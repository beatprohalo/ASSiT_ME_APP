#!/usr/bin/env python3
"""
Gemma Bridge for Music Assistant
Simple Python bridge for Gemma model integration
"""

import sys
import json
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_name = "google/gemma-2-2b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")

def run_gemma(prompt):
    inputs = tokenizer(prompt, return_tensors="pt").to("mps")
    outputs = model.generate(**inputs, max_new_tokens=200)
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

if __name__ == "__main__":
    prompt = sys.argv[1]
    print(json.dumps({"reply": run_gemma(prompt)}))

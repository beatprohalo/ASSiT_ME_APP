#!/usr/bin/env python3
"""
Local AI Model Integration for Music Assistant
Uses Gemma model for local AI responses
"""

import sys
import json
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def load_model():
    """Load the Gemma model and tokenizer"""
    try:
        model_name = "google/gemma-2-2b"
        print(f"Loading model: {model_name}")
        
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(
            model_name, 
            device_map="auto",
            torch_dtype=torch.float16
        )
        
        print("✅ Model loaded successfully")
        return model, tokenizer
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return None, None

def generate_response(prompt, model, tokenizer):
    """Generate response using the local model"""
    try:
        # Prepare input
        inputs = tokenizer(prompt, return_tensors="pt")
        
        # Move to same device as model
        device = next(model.parameters()).device
        inputs = {k: v.to(device) for k, v in inputs.items()}
        
        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs, 
                max_new_tokens=150,
                temperature=0.7,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove the original prompt from response
        if prompt in response:
            response = response.replace(prompt, "").strip()
        
        return response
        
    except Exception as e:
        return f"❌ Error generating response: {e}"

def main():
    """Main function to handle AI requests"""
    if len(sys.argv) < 2:
        print("❌ No prompt provided")
        return
    
    prompt = sys.argv[1]
    
    # Load model
    model, tokenizer = load_model()
    if model is None or tokenizer is None:
        print("❌ Failed to load model")
        return
    
    # Generate response
    response = generate_response(prompt, model, tokenizer)
    
    # Return as JSON
    result = {
        "response": response,
        "model": "gemma-2-2b",
        "local": True
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()

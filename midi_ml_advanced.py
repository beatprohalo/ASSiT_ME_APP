import sys, json, os
import magenta.music as mm
from magenta.models.melody_rnn import melody_rnn_sequence_generator
from magenta.models.shared import sequence_generator_bundle
from note_seq.protobuf import generator_pb2, music_pb2
from magenta.models.music_vae import configs, MusicVAE
import tensorflow as tf

class MIDIMLGenerator:
    def __init__(self):
        self.models = {}
        self.load_models()
    
    def load_models(self):
        """Load pre-trained Magenta models"""
        try:
            # Melody RNN for melody generation
            bundle = sequence_generator_bundle.read_bundle_file("attention_rnn.mag")
            generator_map = melody_rnn_sequence_generator.get_generator_map()
            self.models['melody'] = generator_map["attention_rnn"](checkpoint=None, bundle=bundle)
            self.models['melody'].initialize()
            
            # Music VAE for chord progression generation
            config = configs.CONFIG_MAP['hierdec-trio_16bar']
            self.models['vae'] = MusicVAE(config, batch_size=1, checkpoint_dir_or_path=None)
            self.models['vae'].load_checkpoint()
            
            print("✅ ML models loaded successfully")
        except Exception as e:
            print(f"⚠️ Model loading error: {e}")
    
    def generate_melody(self, prompt, style="trap", key="C", tempo=140):
        """Generate melody based on prompt and style"""
        try:
            # Parse style and key from prompt
            if "trap" in prompt.lower():
                style = "trap"
            elif "jazz" in prompt.lower():
                style = "jazz"
            elif "classical" in prompt.lower():
                style = "classical"
            
            # Extract key from prompt
            if "minor" in prompt.lower():
                key = "C minor"
            elif "major" in prompt.lower():
                key = "C major"
            
            # Extract tempo from prompt
            import re
            tempo_match = re.search(r'(\d+)\s*bpm', prompt.lower())
            if tempo_match:
                tempo = int(tempo_match.group(1))
            
            # Generate sequence based on style
            generator_options = generator_pb2.GeneratorOptions()
            generator_options.args["temperature"].float_value = 1.0
            generator_options.generate_sections.add(start_time=0, end_time=30)
            
            # Style-specific generation
            if style == "trap":
                generator_options.args["temperature"].float_value = 0.8  # More controlled
            elif style == "jazz":
                generator_options.args["temperature"].float_value = 1.2  # More creative
            elif style == "classical":
                generator_options.args["temperature"].float_value = 0.6  # More structured
            
            sequence = self.models['melody'].generate(music_pb2.NoteSequence(), generator_options)
            
            # Set tempo and key
            sequence.tempos[0].qpm = tempo
            sequence.key_signatures[0].key = 0  # C major/minor
            
            return sequence
        except Exception as e:
            print(f"❌ Melody generation error: {e}")
            return None
    
    def generate_chord_progression(self, style="trap", key="C minor"):
        """Generate chord progression using Music VAE"""
        try:
            # Generate chord progression
            z = self.models['vae'].sample(1)
            chord_sequence = self.models['vae'].decode(z)
            
            return chord_sequence[0]
        except Exception as e:
            print(f"❌ Chord generation error: {e}")
            return None
    
    def combine_melody_chords(self, melody_seq, chord_seq):
        """Combine melody and chord sequences"""
        try:
            # Create combined sequence
            combined = music_pb2.NoteSequence()
            combined.CopyFrom(melody_seq)
            
            # Add chord notes
            for note in chord_seq.notes:
                combined.notes.add().CopyFrom(note)
            
            return combined
        except Exception as e:
            print(f"❌ Combination error: {e}")
            return None
    
    def save_midi(self, sequence, filename="generated.mid"):
        """Save sequence as MIDI file"""
        try:
            mm.sequence_proto_to_midi_file(sequence, filename)
            return filename
        except Exception as e:
            print(f"❌ MIDI save error: {e}")
            return None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No prompt provided"}))
        return
    
    prompt = sys.argv[1]
    generator = MIDIMLGenerator()
    
    try:
        # Generate melody
        melody_seq = generator.generate_melody(prompt)
        if not melody_seq:
            print(json.dumps({"error": "Failed to generate melody"}))
            return
        
        # Generate chord progression
        chord_seq = generator.generate_chord_progression()
        if not chord_seq:
            print(json.dumps({"error": "Failed to generate chords"}))
            return
        
        # Combine melody and chords
        combined_seq = generator.combine_melody_chords(melody_seq, chord_seq)
        if not combined_seq:
            print(json.dumps({"error": "Failed to combine sequences"}))
            return
        
        # Save MIDI file
        filename = f"ml_generated_{int(time.time())}.mid"
        result_file = generator.save_midi(combined_seq, filename)
        
        if result_file:
            print(json.dumps({
                "success": True,
                "file": result_file,
                "style": "ml_advanced",
                "prompt": prompt
            }))
        else:
            print(json.dumps({"error": "Failed to save MIDI file"}))
            
    except Exception as e:
        print(json.dumps({"error": f"Generation failed: {str(e)}"}))

if __name__ == "__main__":
    import time
    main()

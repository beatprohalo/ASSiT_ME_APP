import sys, json, os
import magenta.music as mm
from magenta.models.melody_rnn import melody_rnn_sequence_generator
from magenta.models.shared import sequence_generator_bundle
from note_seq.protobuf import generator_pb2, music_pb2
import tensorflow as tf
import numpy as np

class MIDITrainer:
    def __init__(self):
        self.training_data = []
        self.user_style = {}
    
    def analyze_midi_library(self, midi_files):
        """Analyze user's MIDI library to learn their style"""
        try:
            style_patterns = {
                'tempo_ranges': [],
                'key_signatures': [],
                'note_patterns': [],
                'rhythm_patterns': [],
                'chord_progressions': []
            }
            
            for midi_file in midi_files:
                if not os.path.exists(midi_file):
                    continue
                
                # Load MIDI file
                sequence = mm.midi_file_to_sequence_proto(midi_file)
                
                # Analyze tempo
                if sequence.tempos:
                    tempo = sequence.tempos[0].qpm
                    style_patterns['tempo_ranges'].append(tempo)
                
                # Analyze key signature
                if sequence.key_signatures:
                    key = sequence.key_signatures[0].key
                    style_patterns['key_signatures'].append(key)
                
                # Analyze note patterns
                notes = [note.pitch for note in sequence.notes]
                if notes:
                    style_patterns['note_patterns'].extend(notes)
                
                # Analyze rhythm patterns
                durations = [note.end_time - note.start_time for note in sequence.notes]
                if durations:
                    style_patterns['rhythm_patterns'].extend(durations)
            
            # Calculate style statistics
            self.user_style = {
                'avg_tempo': np.mean(style_patterns['tempo_ranges']) if style_patterns['tempo_ranges'] else 120,
                'common_keys': self._get_common_keys(style_patterns['key_signatures']),
                'note_range': self._get_note_range(style_patterns['note_patterns']),
                'rhythm_style': self._analyze_rhythm_style(style_patterns['rhythm_patterns'])
            }
            
            return self.user_style
            
        except Exception as e:
            print(f"❌ Library analysis error: {e}")
            return None
    
    def _get_common_keys(self, keys):
        """Find most common keys in user's library"""
        if not keys:
            return ['C major']
        
        key_counts = {}
        for key in keys:
            key_counts[key] = key_counts.get(key, 0) + 1
        
        # Return top 3 most common keys
        sorted_keys = sorted(key_counts.items(), key=lambda x: x[1], reverse=True)
        return [f"Key {k}" for k, _ in sorted_keys[:3]]
    
    def _get_note_range(self, notes):
        """Analyze note range in user's library"""
        if not notes:
            return {'min': 60, 'max': 84}  # C4 to C6
        
        return {
            'min': min(notes),
            'max': max(notes),
            'avg': np.mean(notes)
        }
    
    def _analyze_rhythm_style(self, durations):
        """Analyze rhythm patterns in user's library"""
        if not durations:
            return 'standard'
        
        avg_duration = np.mean(durations)
        if avg_duration < 0.5:
            return 'fast'
        elif avg_duration > 2.0:
            return 'slow'
        else:
            return 'standard'
    
    def generate_personalized_melody(self, prompt, user_style):
        """Generate melody based on user's learned style"""
        try:
            # Load base model
            bundle = sequence_generator_bundle.read_bundle_file("attention_rnn.mag")
            generator_map = melody_rnn_sequence_generator.get_generator_map()
            generator = generator_map["attention_rnn"](checkpoint=None, bundle=bundle)
            generator.initialize()
            
            # Apply user's style preferences
            generator_options = generator_pb2.GeneratorOptions()
            
            # Set temperature based on user's rhythm style
            if user_style.get('rhythm_style') == 'fast':
                generator_options.args["temperature"].float_value = 0.8
            elif user_style.get('rhythm_style') == 'slow':
                generator_options.args["temperature"].float_value = 1.2
            else:
                generator_options.args["temperature"].float_value = 1.0
            
            # Set tempo based on user's average
            generator_options.generate_sections.add(
                start_time=0, 
                end_time=30
            )
            
            # Generate sequence
            sequence = generator.generate(music_pb2.NoteSequence(), generator_options)
            
            # Apply user's tempo
            if sequence.tempos:
                sequence.tempos[0].qpm = user_style.get('avg_tempo', 120)
            
            # Apply user's key signature
            if sequence.key_signatures and user_style.get('common_keys'):
                # Use most common key
                common_key = user_style['common_keys'][0]
                sequence.key_signatures[0].key = 0  # Simplified key mapping
            
            return sequence
            
        except Exception as e:
            print(f"❌ Personalized generation error: {e}")
            return None
    
    def save_training_data(self, filename="user_style.json"):
        """Save learned user style to file"""
        try:
            with open(filename, 'w') as f:
                json.dump(self.user_style, f, indent=2)
            return filename
        except Exception as e:
            print(f"❌ Save training data error: {e}")
            return None
    
    def load_training_data(self, filename="user_style.json"):
        """Load previously learned user style"""
        try:
            if os.path.exists(filename):
                with open(filename, 'r') as f:
                    self.user_style = json.load(f)
                return True
            return False
        except Exception as e:
            print(f"❌ Load training data error: {e}")
            return False

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        return
    
    command = sys.argv[1]
    trainer = MIDITrainer()
    
    if command == "analyze":
        # Analyze user's MIDI library
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No MIDI files provided"}))
            return
        
        midi_files = json.loads(sys.argv[2])
        user_style = trainer.analyze_midi_library(midi_files)
        
        if user_style:
            # Save learned style
            trainer.save_training_data()
            print(json.dumps({
                "success": True,
                "user_style": user_style,
                "message": "Library analyzed and style learned"
            }))
        else:
            print(json.dumps({"error": "Failed to analyze library"}))
    
    elif command == "generate":
        # Generate personalized melody
        if len(sys.argv) < 3:
            print(json.dumps({"error": "No prompt provided"}))
            return
        
        prompt = sys.argv[2]
        
        # Load user style
        if not trainer.load_training_data():
            print(json.dumps({"error": "No training data found. Please analyze your library first."}))
            return
        
        # Generate personalized melody
        sequence = trainer.generate_personalized_melody(prompt, trainer.user_style)
        
        if sequence:
            # Save MIDI file
            filename = f"personalized_{int(time.time())}.mid"
            mm.sequence_proto_to_midi_file(sequence, filename)
            
            print(json.dumps({
                "success": True,
                "file": filename,
                "style": "personalized",
                "user_style": trainer.user_style
            }))
        else:
            print(json.dumps({"error": "Failed to generate personalized melody"}))

if __name__ == "__main__":
    import time
    main()

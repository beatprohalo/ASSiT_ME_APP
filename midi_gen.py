import sys, json
import magenta.music as mm
from magenta.models.melody_rnn import melody_rnn_sequence_generator
from magenta.models.shared import sequence_generator_bundle
from note_seq.protobuf import generator_pb2, music_pb2

# Load pre-trained Melody RNN
bundle = sequence_generator_bundle.read_bundle_file("attention_rnn.mag")
generator_map = melody_rnn_sequence_generator.get_generator_map()
melody_rnn = generator_map["attention_rnn"](checkpoint=None, bundle=bundle)
melody_rnn.initialize()

# Input from Electron
prompt = sys.argv[1]

# Generate sequence (30 sec MIDI)
generator_options = generator_pb2.GeneratorOptions()
generator_options.args["temperature"].float_value = 1.0
generator_options.generate_sections.add(start_time=0, end_time=30)

sequence = melody_rnn.generate(music_pb2.NoteSequence(), generator_options)

# Save to file
out_file = "generated.mid"
mm.sequence_proto_to_midi_file(sequence, out_file)

print(json.dumps({"file": out_file}))

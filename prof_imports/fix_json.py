import sys
import json

def main():
    if len(sys.argv) != 3:
        print("Usage: python fix_json.py input.json output.json")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file, "r", encoding="utf-8") as f:
        text = f.read()

    objects = []
    decoder = json.JSONDecoder()

    i = 0
    n = len(text)

    while True:
        while i < n and text[i].isspace():
            i += 1
        if i >= n:
            break

        obj, end = decoder.raw_decode(text, i)
        i = end

        if isinstance(obj, dict) and "data" in obj and isinstance(obj["data"], list):
            objects.extend(obj["data"])
        elif isinstance(obj, list):
            objects.extend(obj)
        else:
            objects.append(obj)

    with open(output_file, "w", encoding="utf-8") as out:
        json.dump(objects, out, ensure_ascii=False)

    print("Done")
    print("Total courses saved:", len(objects))
    print("Output file:", output_file)

if __name__ == "__main__":
    main()
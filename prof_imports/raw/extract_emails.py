import json
import csv
import re

RAW_JSON_FILES = [
    "fall25_raw.json",
    "spring26_raw.json",
    "summer25_raw.json"
]

OUTPUT_CSV_FILE = "uic_professors_11_100_emails.csv"
OUTPUT_TXT_FILE = "uic_professors_11_100_emails.txt"

ranked_professors = [
    "Yeow Siow",
    "Jennifer Rupert",
    "Willow Schenwar",
    "Andrea Bassett",
    "Bill McCarty",
    "Hossein Ataei",
    "Vahe Caliskan",
    "Ozgur Arslan Ayaydin",
    "Tarini Bedi",
    "Behzod Ahundjanov",
    "Jumana Almahamid",
    "Neel Patel",
    "Mark Magoon",
    "JP Prims",
    "John Steenbergen",
    "Mitchell Roitman",
    "Ruth Rosenberg",
    "Jonathan Komperda",
    "Kheir Al-Kodmany",
    "Jennifer Olson",
    "George Maratos",
    "Jennifer Pajda-De La O",
    "Gregory Larnell",
    "Marsha Cassidy",
    "Vi Diep",
    "Christopher Baker",
    "Dean Andrews",
    "Julie Chen",
    "Boris Igic",
    "Faith Kares",
    "Morgan Lord",
    "Paul Rodriguez",
    "Mark Bennett",
    "Sigrid Luhr",
    "Heather Doble",
    "Som Ale",
    "Matthew Lippman",
    "Catherine Vlahos",
    "Sudip Mazumder",
    "Michael Muller",
    "John Casey",
    "Ronak Kapadia",
    "Kian Bergstrom",
    "Katherine Boulay",
    "Jie Wang",
    "Vladimir Goncharoff",
    "John Goldbach",
    "Karrie Hamstra-Wright",
    "Laura Dingeldein",
    "Ronald DeWald",
    "Sara Hall",
    "Stephen Gramsch",
    "Dermot Murphy",
    "Adrian Barkan",
    "Philip Hayek",
    "Karen Underhill",
    "Duha Hamed",
    "Mariana Gariazzo",
    "Robert Becker",
    "Brandon Antwiler",
    "William Ford",
    "Janis Page",
    "Timothy Murphy",
    "Danny Martin",
    "Emilia Ozan",
    "Yeasir Alve",
    "Shawn Healy",
    "Kevin James",
    "Shelley Brickson",
    "Tiana Kieso",
    "Jacinta Banks",
    "Jakob Eriksson",
    "David Diego Rodriguez",
    "Karen Su",
    "Anthony Felder",
    "Krishna Reddy",
    "Wenjing Rao",
    "Brynne Nicolsen",
    "Emily Minor",
    "Angela Dancey",
    "David Marquez",
    "Mara Martinez",
    "Dale Embers",
    "Eva Lord",
    "Cory Davis",
    "Karen Leick",
    "Ghassan Aburqayeq",
    "Alexander Nekrasov",
    "Tomer Kanan",
    "Mark Grechanik"
]

def normalize_name(name: str) -> str:
    name = name.lower().strip()
    name = name.replace(",", " ")
    name = re.sub(r"\s+", " ", name)
    return name

def banner_to_normal(display_name: str) -> str:
    parts = [p.strip() for p in display_name.split(",")]
    if len(parts) == 2:
        last, first = parts
        return normalize_name(f"{first} {last}")
    return normalize_name(display_name)

def extract_sections_from_file(filename: str):
    with open(filename, "r", encoding="utf-8") as f:
        raw = json.load(f)

    sections = []

    if isinstance(raw, list):
        for item in raw:
            if isinstance(item, dict) and "data" in item and isinstance(item["data"], list):
                sections.extend(item["data"])
            elif isinstance(item, dict):
                sections.append(item)

    elif isinstance(raw, dict):
        if "data" in raw and isinstance(raw["data"], list):
            sections.extend(raw["data"])
        else:
            sections.append(raw)

    return sections

data = []
for file in RAW_JSON_FILES:
    data.extend(extract_sections_from_file(file))

target_names = {normalize_name(name): name for name in ranked_professors}
matches = {}

for section in data:
    faculty_list = section.get("faculty", [])
    for prof in faculty_list:
        display_name = prof.get("displayName", "").strip()
        email = (prof.get("emailAddress") or "").strip()

        if not display_name or not email:
            continue

        normalized_display = banner_to_normal(display_name)

        if normalized_display in target_names:
            original_name = target_names[normalized_display]
            if original_name not in matches:
                matches[original_name] = {
                    "name": original_name,
                    "email": email,
                    "banner_display_name": display_name
                }

found_rows = []
missing_names = []

for name in ranked_professors:
    if name in matches:
        found_rows.append(matches[name])
    else:
        missing_names.append(name)

with open(OUTPUT_CSV_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Ranked Name", "Banner Name", "Email"])
    for row in found_rows:
        writer.writerow([row["name"], row["banner_display_name"], row["email"]])

emails = [row["email"] for row in found_rows]

batch_size = 25

with open("email_batches.txt", "w", encoding="utf-8") as f:
    for i in range(0, len(emails), batch_size):
        batch = emails[i:i + batch_size]
        f.write(", ".join(batch) + "\n\n")

print(f"Found: {len(found_rows)}")
print(f"Missing: {len(missing_names)}")

if missing_names:
    print("\nMissing professors:")
    for name in missing_names:
        print(name)

print(f"\nSaved CSV to: {OUTPUT_CSV_FILE}")
print(f"Saved TXT to: {OUTPUT_TXT_FILE}")
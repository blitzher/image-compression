all_roles = [
    "Referent",
    "Ordstyrer",
    "Trello-styrer",
    "Rødtråd-gut",
    "Free",
    "Free",
    "Free"
]

all_names = [
    "Skovborg",
    "Fred. Møller",
    "Fred. Holm",
    "Bui",
    "Klement",
    "Oliver",
    "Jacob"
]

dict_names = { name:i for i, name in enumerate(all_names)}

print("[{:^4}]".format("Week"), end = "")
for role in all_roles:
    print("[{:^14}]".format( role ), end="")
print()

for week in range(4, 30):
    print("[{:^4}]".format(week), end="")
    for name in all_names:
        role_index = (dict_names[name] + week) % len(all_roles)
        print("[{:^14}]".format( all_names[role_index] ), end="")
    print()
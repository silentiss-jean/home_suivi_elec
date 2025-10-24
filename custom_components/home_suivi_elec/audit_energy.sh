#!/bin/bash

ENTITY_FILE=/config/.storage/core.entity_registry

echo "🔎 Liste des sensors énergétiques avec leur platform :"
cat $ENTITY_FILE | \
grep -Ei '"unit_of_measurement": *"(w|kw|kwh|wh|mwh)"|"device_class": *"(power|energy)"' | \
grep '"platform"' | \
sed -n 's/.*"entity_id": "\([^"]*\)",.*"platform": "\([^"]*\)".*/\2\t\1/p' | \
sort | uniq


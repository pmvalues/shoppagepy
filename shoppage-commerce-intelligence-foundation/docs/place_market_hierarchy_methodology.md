# Zimbabwe place and market hierarchy methodology

## Implemented graph

The place graph materializes every feature in the Zimbabwe GeoNames export and connects it to country, province-candidate, and district-candidate scaffolding using the source administrative codes. Populated places are retained as settlements; physical, hydrographic, terrain, site, route, vegetation, and area features remain typed reference nodes rather than being discarded.

Explicit OpenStreetMap `amenity=marketplace` and `shop=mall` records are added as commercial market nodes. An exact, unambiguous source city name is used when available. Otherwise, the nearest GeoNames settlement is proposed as a parent and placed in a review queue with its distance.

## Evidence boundary

- GeoNames is a discovery scaffold, not the production authority for Zimbabwe administrative boundaries.
- ZIMSTAT boundaries and official administrative registers must control province, district, ward, and locality hierarchy in production.
- OpenStreetMap markets and malls are discovery records under ODbL, not proof that a venue is currently operating.
- Proximity does not prove containment. Every proposed market parent requires review.
- No market-in-market edge is created without polygon, address, operator, or explicit source-containment evidence.

## Outputs

- `data/study/zimbabwe_place_market_nodes.csv`
- `data/study/zimbabwe_place_market_edges.csv`
- `data/review/place_market_parent_review_queue.csv`
- `quality/zimbabwe_place_market_hierarchy_profile.json`
- `quality/zimbabwe_place_market_hierarchy_validation.json`

## Next production steps

1. Reconcile the administrative scaffold to current ZIMSTAT boundary identifiers and geometries.
2. Acquire municipal market registers and operator directories.
3. Resolve duplicate and multipart OpenStreetMap venue features.
4. Use venue polygons and explicit membership evidence to create market-in-market, building-in-market, section-in-market, store-in-mall, and stall-in-section edges.
5. Version delivery zones and service areas separately from administrative containment.

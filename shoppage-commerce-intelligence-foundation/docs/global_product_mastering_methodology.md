# Global product mastering methodology

## What this milestone proves

The build can ingest and index at least 1,000,000 distinct product identities from a full global source export. Each stored record has a stable Shoppage master identifier, a source identity, product-family key, selected descriptive and nutritional features, source provenance, and an explicit local-availability boundary.

It does **not** prove that these products are sold, stocked, priced, or available in Zimbabwe. Local commercial observations must be captured separately as seller offers and linked to these masters with evidence and observation dates.

## Source and licence boundary

- Source: Open Food Facts full CSV export.
- Database licence: Open Database License (ODbL); individual database contents are under the Database Contents License.
- Images are excluded from this build. Open Food Facts image licensing has separate attribution obligations.
- The raw compressed export is retained only as working material; the deliverable contains the mastered database and reproducible scripts, not the 1.275 GB raw file.

## Identity strategy

1. A source code passing the GTIN-8, GTIN-12, GTIN-13, or GTIN-14 checksum becomes `gtin:<code>`.
2. A non-GTIN source code becomes `off:<code>` and remains source-scoped.
3. Duplicate source codes are skipped before the target counter advances.
4. The build stops only after 1,000,000 unique source codes have been stored.
5. A family key groups records by the most specific available category, falling back to normalized generic or product-name evidence. Family membership is a navigational grouping, not proof that two SKUs are interchangeable.

## Global feature enrichment

The master seed preserves the strongest available source fields for:

- product and generic names;
- brand, quantity, and packaging;
- category path and tags;
- countries and manufacturing places;
- ingredients, allergens, and labels;
- Nutri-Score, NOVA, and Eco-Score fields where present;
- selected nutrition per 100 g, serving size, additives, food groups, and PNNS groups.

Missing values remain missing. They are not inferred or filled from unrelated products.

## Zimbabwe offer linkage to implement next

The local observation grain should be `(seller branch, seller product, master product, market, observed_at, price, currency, stock state, source evidence)`. Matching should use GTIN first, then supplier identifiers, then high-confidence brand/name/quantity/packaging evidence. Ambiguous matches must enter a review queue rather than being silently merged.

## Quality interpretation

The first million is a deterministic prefix of the current daily export. It supports scale, schema, and pipeline testing but is not a representative sample of Zimbabwe demand. Coverage rates for names, brands, categories, and features are reported as data-quality facts, not hidden behind imputation.

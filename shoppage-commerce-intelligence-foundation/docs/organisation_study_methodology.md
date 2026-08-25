# Zimbabwe organisation study methodology

## Current evidence

- 6,101 source records.
- 5,281 distinct normalized-name candidates.
- 5,899 records with an ISIC Rev. 5 candidate (96.7%).
- 4,536 records mapped to a four-digit ISIC class (74.3%).
- 202 activity records deliberately unresolved because the source description is too generic.
- 21 normalized-name groups appear in more than one source and are queued as cross-source match candidates.

## Sources and grain

| Source | Records | Grain | Authority boundary |
|---|---:|---|---|
| OpenStreetMap | 5,318 | Named mapped element with a selected commercial tag | Discovery only; may represent a business, branch, institution, facility or commercial place |
| RBZ microfinance register | 339 | One numbered registered institution | Register scope as of 31 March 2026 |
| Zimbabwe Stock Exchange | 45 | One listed-company candidate | Exchange listing and source sector; not full operational activity |
| ZERA petroleum register | 399 | One normalized registered-name candidate aggregated from 1,146 licences | Petroleum licence scope as of 8 June 2026 |

## Activity mapping

The study stores both the source activity and the ISIC hypothesis. Specific source tags such as `amenity=fuel`, `shop=hardware`, a ZERA retail licence or an RBZ microfinance registration can support a four-digit candidate. Generic evidence such as `office=company` remains unresolved.

Mapping confidence describes source-to-class confidence, not verification that the organisation currently performs the activity. Every study record requires human review.

## Entity resolution boundary

Name normalization removes punctuation and common legal suffixes only. It does not merge records. The same normalized name can represent a chain, branches, related companies or unrelated businesses. Coordinates, addresses, identifiers, regulator records, trade names, brand/operator relationships and merchant claims must drive the final decision.

## Validation gate

The automated validation requires:

- at least 5,000 study records;
- at least 5,000 distinct normalized names;
- unique study and source-candidate IDs;
- complete required provenance/activity fields;
- all ISIC candidates present in the loaded ISIC Rev. 5 reference;
- at least 90% ISIC candidate coverage;
- human review required for every row;
- no candidate falsely marked `verified`.

Passing this gate proves a 5,000-plus source-backed candidate study. It does not prove 5,000 legally verified, currently operating companies.

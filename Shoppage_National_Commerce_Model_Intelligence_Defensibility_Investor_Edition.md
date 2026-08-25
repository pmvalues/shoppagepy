SHOPPAGE

# National Commerce Media Infrastructure

Zimbabwe National Commerce Intelligence, Media and Market Infrastructure

Shoppage Central | Shoppage Showcase | Shoppage Ads | Shoppage Creators | Shoppage Markets

Intelligence, Defensibility and Investor Edition - July 2026


# Document purpose and decision status

This document replaces the earlier Shopscene / ShopPage naming structure and extends the Shoppage implementation blueprint. The whole project is Shoppage. Shoppage Central, Showcase, Ads, Creators and Markets are connected operating layers under one identity system, commerce graph, trust framework, data model and commercial strategy. This edition adds the non-negotiable defensibility, intelligence, international-quality, AI, daily-utility and investor requirements needed to build a national platform rather than a copyable marketplace.


# Contents

Page references correspond to this implementation edition.


# 1. Executive decision

Shoppage should be built as the local operating and distribution system for Zimbabwean commerce. The platform must organise the commercial activity that is currently fragmented across Facebook pages and groups, Facebook Marketplace, WhatsApp catalogues and statuses, Google Search and Maps, short-form video, classifieds, physical markets, shopping centres, informal sellers, creators and diaspora buying networks.

The strongest strategic position is not to ask Zimbabweans to abandon Facebook or WhatsApp immediately. Shoppage should first make those channels work better by giving every merchant a structured catalogue, trackable links, shoppable videos, verified identity, fresh stock signals and measurable leads. It then progressively converts external reach into Shoppage-owned demand, data and advertising inventory.

The business succeeds when a buyer thinks "search Shoppage" before asking a Facebook group, scrolling old posts or calling multiple shops. It succeeds commercially when a merchant allocates part of the budget previously spent on Facebook boosts, Google ads, page administrators or informal influencers to Shoppage because the platform produces clearer local buyer intent and attributable outcomes.


## 1.1 What "fully functional in three months" means

A fully functional version 1 means every layer can complete its primary commercial job end to end. It does not mean every long-term feature is present. The scope boundary is essential because AI-assisted development accelerates implementation, but it does not remove the need for product decisions, data quality, security, merchant onboarding, moderation, field operations and adoption.


# 2. Zimbabwe ground reality and design consequences

The model must work with actual Zimbabwean constraints rather than imported assumptions. Public evidence published in 2025-2026 describes e-commerce as largely informal, urban-centred and diaspora-driven, with Facebook Marketplace and WhatsApp central to discovery and negotiation. Cash, cash on delivery, mobile payments and direct arrangements remain more common than conventional card-first e-commerce. Internet reach is material but not universal, and data cost, trust, fragmented logistics and uneven digital capability remain binding constraints.

Digital 2026 estimates indicate approximately 6.54 million individual internet users and 2.60 million social media user identities in Zimbabwe at the end of 2025, alongside 16.2 million active cellular connections. These numbers justify a mobile-first opportunity, but they also warn against designing for permanent high-speed connectivity or assuming every mobile connection represents an active internet shopper.

The correct product stance is therefore hybrid: smartphone-first but low-data; digital-first but assisted; national in ambition but city-by-city in execution; payments-enabled but not checkout-dependent; content-rich but linked to structured products; and commercially independent while partnership-ready for government, financial institutions, mobile operators, brands and local authorities.


# 3. National value proposition and endorsement readiness

Presidential-level or national endorsement cannot be guaranteed and should never be treated as a substitute for product-market fit. Shoppage can, however, be designed to be endorsement-ready by producing measurable public value, maintaining political neutrality, complying with law and presenting a credible national-development case.


## 3.1 Presidential and institutional briefing package

- A two-page national impact brief with quantified jobs, MSME digitisation, local ad retention and provincial coverage.

- A live demonstration showing a market trader creating a catalogue, a buyer finding a nearby product and a creator earning from a tracked lead.

- A 100-day scorecard with independently verifiable figures rather than vanity registrations.

- A data-governance note explaining privacy, lawful access, localisation roadmap and non-partisan controls.

- A partnership menu for ministries, local authorities, ZimTrade, financial institutions, telecom operators, market associations and universities.

- A clear statement that endorsement does not confer ownership, exclusive access or procurement preference.


# 4. Brand and product architecture

Shoppage is the master brand. The five layers should appear as connected destinations and capabilities, not separate companies. Users may enter through any layer, but identity, catalogue, trust, analytics, billing and data remain unified.

Recommended domain pattern: shoppage.co.zw as the public destination; manage.shoppage.co.zw for merchant operations; ads.shoppage.co.zw for campaign management; creators.shoppage.co.zw for creator tools; and market pages under shoppage.co.zw/markets/{slug}. During the first three months these may be routes in one application rather than separate deployments. This reduces cost and prevents duplicated authentication, analytics and user experience.

The name should undergo trademark, company-name and domain due diligence before major public investment. Brand guidelines should establish one logo system, one typography and colour system, one trust badge hierarchy and one naming rule. "Shoppage" should always refer to the ecosystem; module names are descriptors, not independent brands.


# 5. Shoppage Central - merchant operating system

Shoppage Central is the foundation. It must create standalone value before Shoppage has national consumer traffic. A merchant should gain an organised digital presence, a catalogue, social-ready content, lead tracking and basic business insight even when most customers still arrive from Facebook or WhatsApp.


## 5.1 Core merchant jobs

- Create and verify a business, seller or market-stall identity.

- Create one or more stores, branches, pickup points and delivery zones.

- Add products through manual entry, spreadsheet, assisted upload, image extraction or approved import.

- Manage price, currency, price validity, promotions, stock state and last-confirmed availability.

- Upload product images and short videos, then reuse them across Showcase and external social channels.

- Receive leads from WhatsApp, calls, quote requests, reservations and creator content.

- Assign staff roles and track who changed prices, stock or campaign settings.

- View actionable analytics rather than only impressions and likes.

- Buy advertising, invite creators and join relevant Shoppage Markets.


## 5.2 Merchant experience design

The merchant interface must be mobile-first. Refine or another dense admin framework can remain useful for Shoppage operations and larger merchants, but the typical vendor experience should be a simplified Next.js mobile workspace. The most common actions - confirm stock, change price, upload a clip, answer a lead and boost a product - should require no more than a few taps.


## 5.3 Freshness as a product system

Listing freshness is a core commercial control, not a cosmetic timestamp. Each sellable item needs a freshness state computed from merchant confirmation, price changes, enquiries, stock updates and customer reports.

Category windows should differ. Fast-moving electronics and groceries need shorter confirmation intervals than custom furniture or building services. Merchants must be able to bulk-confirm unchanged items, while high-risk mass confirmation should trigger spot checks.


# 6. Shoppage Showcase - geolocal discovery and commerce video

Showcase is the buyer front door. It combines high-intent search with a low-data short-video commerce feed. It should not imitate TikTok as a general entertainment network. Its advantage is that every useful piece of content resolves into a product, vendor, market, offer, service or buyer action.


## 6.1 Core buyer surfaces


## 6.2 Geolocal commerce engine

Geo should influence every major ranking and advertising decision. The system must recognise country, province, city, suburb, commercial cluster, branch, pickup point, delivery radius and market boundary. Location must never be inferred more precisely than necessary without user permission.

- Products near me, available today and open now.

- Deals within a selected distance or delivery zone.

- Branch-level availability and collection options.

- Popular products in a suburb, city or market cluster.

- Buyer requests routed by category, radius, trust and response capacity.

- Ads constrained by service area so merchants do not pay for unreachable demand.

- Geo-demand reports that help vendors choose stock, branches and campaigns.

Manual location selection is mandatory because GPS may be disabled, inaccurate or costly. Users should be able to choose a city, suburb, landmark or market. Rural and peri-urban discovery should use towns, growth points, routes and delivery corridors rather than assuming street-level addressing.


## 6.3 Short-form commerce video

For version 1, clips should normally be 10-60 seconds, compressed and auto-captioned. Autoplay should be muted, preloading conservative and a low-data mode available. A managed video service should handle direct creator uploads, encoding, adaptive delivery, thumbnails and basic analytics. Cloudflare Stream is a practical initial choice; Mux is a credible alternative if its analytics or workflow fit is superior.


# 7. Shoppage Ads - Zimbabwean commercial attention and measurable demand

Shoppage Ads is the primary strategic mechanism for retaining more advertising value inside Zimbabwe. It must not copy the full complexity of Meta Ads Manager. The initial product should be simpler, locally understandable and focused on commercial outcomes that merchants can verify.


## 7.1 Advertising doctrine

- Sell purchase intent, qualified reach and measurable action - not vanity engagement.

- Only promote products or services with adequate identity, content and freshness quality.

- Label every paid placement clearly while preserving useful organic results.

- Give small merchants simple objectives and guardrails; give agencies and brands deeper controls later.

- Keep billing transparent across USD and ZWG display, with dated exchange assumptions.

- Prevent political advertising from entering the commerce system during the initial operating period.

- Protect buyers from misleading discounts, counterfeit claims and unsafe products.


## 7.2 Version 1 ad products


## 7.3 Campaign workflow

1. Choose an objective: visibility, catalogue visits, WhatsApp leads, calls, quote requests, store visits or sales later.

1. Select product, store, market or video creative.

1. Select category, city/area, budget, dates and optional buyer signals.

1. Run automated checks for prohibited content, stale inventory, missing price, weak media and misleading claims.

1. Approve automatically for low-risk trusted advertisers or route to human review.

1. Deliver placements with frequency limits and organic-result safeguards.

1. Report spend, reach, clicks, leads, response and verified outcomes.

1. Provide AI-generated recommendations without silently changing budget or targeting.

Merchants with limited digital skill should be able to buy a fixed package such as "Promote this product in Harare for US$20 over seven days". Larger merchants need account billing, campaign groups, branches, product feeds and downloadable reports. Managed campaigns should be a first-class service because they create early revenue while the self-service market matures.


## 7.4 Local advertising retention model

Shoppage cannot claim that every advertising dollar remains in Zimbabwe because hosting, payment processing, software and international infrastructure may create foreign costs. The credible claim is that platform revenue, merchant relationships, campaign capability, creator payouts, employment and commerce data are governed through a Zimbabwean business rather than being fully captured by global platforms.


# 8. Shoppage Creators - affiliate commerce and content production

Creators are not an optional marketing add-on. They are a distributed sales, education and merchant-digitisation network. Zimbabwean Facebook group administrators, WhatsApp community operators, videographers, product reviewers, campus promoters, technicians and local deal pages can all become commerce creators.


## 8.1 Creator roles


## 8.2 Creator safeguards

- Every paid or commission-bearing post must carry a standard sponsored or affiliate disclosure.

- Creators cannot publish fabricated reviews, false scarcity, undisclosed ownership or unsupported performance claims.

- High-risk categories require subject-matter review or may be excluded.

- Attribution must resist self-referrals, fake clicks, duplicate leads and collusion with vendors.

- Payouts should depend on a documented event definition and a dispute window.

- Creators need content rights, music rights, customer-consent and privacy training.

- Vendors must approve products and commission terms before creator promotion.


## 8.3 Attribution model

Version 1 attribution should be simple and auditable. Each creator receives a tagged product or collection link and optional campaign code. The platform records view, product open, save, WhatsApp click, call, quote request and vendor-confirmed outcome. Commission should initially favour verified leads and fixed content fees because most purchases will close outside Shoppage.


# 9. Shoppage Markets - market-in-market infrastructure

Zimbabwean commerce is clustered in malls, CBD blocks, industrial areas, flea markets, growth points, supplier streets, agricultural centres and informal trading spaces. Shoppage Markets digitises the cluster itself, creating a unit of discovery and advertising above the individual shop.


## 9.1 Market types

- Physical malls and shopping centres.

- CBD blocks, streets and arcades.

- Flea markets, market stalls and informal trader associations.

- Industrial and supplier clusters such as hardware, automotive or manufacturing zones.

- Thematic online markets such as Home and Power, Back to School or Made in Zimbabwe.

- Temporary event markets, expos, agricultural shows and seasonal campaigns.

- Diaspora-curated markets for home building, gifting, school and family support.


## 9.2 Market operating model


## 9.3 Market page requirements

- Market identity, location, boundaries, hours, access and contact.

- Vendor directory with categories, verification and branch or stall position.

- Combined product and short-video feed.

- Market-wide search and buyer request routing.

- Events, campaigns, seasonal promotions and sponsorship placements.

- QR signage that opens a specific market, vendor, aisle or collection.

- Market analytics: demand, vendor activity, searches, leads and campaign results.

- Admin controls for membership, content rules and complaints.

Markets create a practical field distribution model. Instead of acquiring vendors one by one across a city, Shoppage can sign a market owner or association, train one captain and activate a dense supply cluster. Dense clusters improve buyer utility, creator content and local advertising inventory simultaneously.


# 10. Shared horizontal engines

The five layers depend on common engines. Building them once prevents fragmented user accounts, inconsistent data and duplicated costs.


# 11. Priority users and jobs to be done

A platform that serves everyone equally at launch serves nobody well. Shoppage should prioritise users whose commercial pain is acute and whose behaviour fits the product.


# 12. End-to-end commercial journeys

The business model should be tested through complete journeys, not isolated features.


## 12.1 Merchant activation journey

1. Merchant is recruited through field agent, market captain, creator, referral or self-registration.

1. Phone and identity are verified; business and location evidence are added progressively.

1. AI-assisted onboarding extracts products from approved photos, spreadsheets or merchant-provided social material.

1. Merchant confirms title, price, currency, stock, location and fulfilment.

1. Shoppage creates the storefront, QR code and shareable product links.

1. Merchant publishes a clip or exports a social post that links back to the structured catalogue.

1. First lead is tracked; merchant receives a response reminder and closes the lead.

1. Merchant is offered a small ad or creator campaign only after catalogue quality is adequate.


## 12.2 Buyer journey

1. Buyer arrives from search, shared link, market QR, creator clip or direct visit.

1. Buyer selects location or grants coarse location permission.

1. Buyer searches, browses nearby, watches clips or submits a structured request.

1. Results show relevance, distance, freshness, trust and sponsored status.

1. Buyer opens product, checks seller, price, branch and fulfilment.

1. Buyer saves, compares, calls, WhatsApps or requests a quote without mandatory registration.

1. Shoppage records the lead source and prompts the merchant to respond.

1. Buyer can report inaccurate stock, misleading price or seller conduct.


## 12.3 Creator campaign journey

1. Vendor selects approved products, creator eligibility and commission or production budget.

1. Creators apply or are invited based on category, area and quality.

1. Brief, disclosure, content rights, dates and payout events are agreed.

1. Creator records a tagged clip or collection and submits for review.

1. Content publishes in Showcase and may be exported externally.

1. Attribution follows view-to-action events and verified outcomes.

1. Vendor and creator receive transparent reporting; disputes follow a defined process.


# 13. Competitive strategy

Shoppage will face global platforms with enormous reach and local platforms with existing awareness. It should not attempt to beat each player at its strongest feature. It should combine local functions that no single competitor currently integrates well.


## 13.1 Global pattern library - adopt selectively


# 14. Network effects and defensible moat

The interface can be copied. The defensible asset is the interconnected local commerce graph and the operating relationships required to keep it accurate.

The strongest flywheel is: merchants create fresh supply; supply makes Showcase useful; buyer actions reveal demand; demand attracts advertisers and creators; ads and creators generate merchant outcomes; outcomes improve retention and fund more onboarding; markets create dense clusters that accelerate every step.


# 15. Revenue model and pricing architecture

Shoppage must diversify revenue while keeping merchant entry friction low. Subscription revenue alone will be insufficient early because many MSMEs need proof of leads before committing to recurring software fees. Managed services, advertising, onboarding and institutional packages should support the first six months.


## 15.1 Revenue pillars


## 15.2 Pricing hypotheses for validation

Pricing is a test framework, not a final tariff. Plans must be configurable and allow local invoices in supported currencies. Shoppage should avoid hard-coding product limits, fees or commission rates. Early founding merchants may receive time-limited free Growth access in exchange for complete catalogues, weekly feedback and permission to use performance case studies.


## 15.3 Scenario economics - not a forecast

The revenue ranges depend more on field activation, ad sales and merchant retention than on software completion. Break-even should not be assumed by month six. The base case requires disciplined costs, founder-led sales, local talent, managed infrastructure and avoidance of a proprietary logistics fleet.


# 16. Delivery budget and operating model

AI-assisted development can compress coding time, but a credible launch still requires engineering, product, design, field operations, merchant success, moderation, sales and compliance. The budget should be chosen explicitly rather than allowing an undefined scope to consume cash.

These ranges exclude large subsidies, major celebrity campaigns, owned delivery vehicles, office build-outs and national advertising. Cloud, video and messaging costs should start modestly but be instrumented by user and feature so that unit economics remain visible.


## 16.1 Minimum launch team


# 17. Go-to-market strategy

Shoppage should launch as a curated commercial network, not an open empty marketplace. Supply density, freshness and merchant response quality must be established before broad consumer promotion.


## 17.1 Launch wedge


## 17.2 Merchant acquisition channels

- Founder-led acquisition of anchor merchants with broad catalogues and recognised locations.

- Market and mall agreements that activate multiple sellers through one relationship.

- Creator and field-agent referral incentives tied to activated, fresh catalogues - not raw registrations.

- Import assistance for merchants already posting on Facebook and WhatsApp, using only merchant-authorised data.

- Partnerships with distributors, brands, associations and service providers.

- Founding-merchant programme with free access, professional setup and performance reviews.

- Case studies showing search-to-lead and content-to-lead outcomes.


## 17.3 Buyer acquisition channels

- Shareable product, market and video links distributed through Facebook and WhatsApp.

- QR codes at stores, markets, events, receipts, packaging and delivery points.

- Creator collections and local deal content.

- Search-engine-indexed product and vendor pages.

- Buyer-request campaigns: "Tell Shoppage what you need; matched vendors respond."

- Category content and price guides that answer local buying questions.

- Partnership campaigns with markets, brands, radio, community pages and institutions.


# 18. Field operations and the 1,000-entity market register

The 1,000-entity research requirement should become an operational asset rather than a presentation claim. Shoppage should build a structured market register during launch, combining research, sales pipeline and catalogue acquisition.

Each record must have a source, date, owner, consent status where contact data is stored, verification state and next action. Public Facebook observations can inform patterns, but Shoppage must not violate platform terms, bypass access controls or scrape private data. Merchant-authorised imports and manual field verification are the safe default.


## 18.1 Merchant activation standard


# 19. Trust, safety and consumer protection

Trust should be visible, progressive and explainable. Shoppage must not create a badge that buyers interpret as a guarantee when only a phone number was checked.


## 19.1 Safety controls

- Prohibited and restricted goods policy before launch.

- High-risk category rules and manual review.

- Suspicious price and duplicate-image detection.

- New-account limits on ads, reach and mass uploads.

- Buyer warnings for off-platform deposits and unverifiable claims.

- Complaint intake, evidence upload, response deadlines and appeal.

- Creator and advertiser disclosure enforcement.

- Product recall and urgent content takedown process.

- Law-enforcement request process reviewed by counsel and logged.

Reviews should not launch as an unmoderated star-rating system. Early trust is better built from verified transactions or leads, response metrics, listing accuracy, complaint handling and structured buyer feedback. Anonymous public accusations can create defamation and manipulation risk.


# 20. Payments, currencies, fulfilment and logistics

Shoppage should orchestrate commerce without becoming a bank, payment processor or logistics fleet. Version 1 must represent how a transaction can be completed and pass the buyer to an appropriate rail, while keeping enough context to measure outcomes.

Multi-vendor cart, split settlement, refunds, chargebacks and owned fulfilment are intentionally excluded from the first three months. They can easily consume the entire development programme while failing to solve the primary discovery, trust and merchant-growth problem.


# 21. AI operating model

AI should reduce the cost of creating and maintaining a high-quality local commerce graph. It should not be positioned as a decorative chatbot or allowed to make unreviewed commercial, moderation or payment decisions.


## 21.1 AI for merchant operations

- Extract product titles, prices, attributes and contacts from merchant-authorised images, PDFs and spreadsheets.

- Clean titles, standardise brands and suggest categories while preserving original data.

- Generate missing descriptions, specifications and social captions for merchant approval.

- Detect duplicates, improbable prices, stale products and conflicting branch information.

- Create video captions, thumbnails, price overlays and translated text.

- Summarise leads and suggest follow-up actions.

- Recommend which products need confirmation, promotion or better media.


## 21.2 AI for buyers, ads and creators

- Semantic search across local naming variations and mixed-language queries.

- Buyer-request parsing and vendor matching.

- Product and content recommendations constrained by location, freshness and safety.

- Campaign budget and creative suggestions based on verified outcomes.

- Creator-product matching based on category, geography, quality and audience fit.

- Fraud, spam, prohibited-content and misleading-claim risk scoring.

- Customer-support triage with human escalation.


## 21.3 AI development discipline


# 22. Technology architecture

The existing modular-monolith direction remains appropriate. The launch architecture should maximise speed, type safety, tenant isolation and managed infrastructure while keeping future extraction possible.

A separate native mobile app is not required for the 0-3 month launch. A strong PWA provides shareable URLs, search visibility, app-like navigation and one codebase. Native applications can be introduced after repeat usage, notification needs, offline workflows or device integration justify the maintenance cost.


## 22.1 Module boundaries


# 23. Data governance, privacy and security

Shoppage will process identity, location, contact, behavioural, advertising and potentially payment-related data. Privacy and security must be designed before launch, not added after an endorsement or incident.

- Register and operate as required under Zimbabwe data-protection rules, with counsel confirming controller and processor obligations.

- Collect the minimum location precision and personal data needed for each function.

- Use explicit purpose notices for merchant verification, buyer accounts, creator attribution and advertising.

- Maintain consent, lawful-basis, access, correction, deletion and retention workflows.

- Separate public business data from private identity and verification documents.

- Encrypt data in transit and at rest; protect secrets with managed key and environment controls.

- Apply PostgreSQL row-level security as defence in depth, but keep NestJS authorisation authoritative.

- Require multi-factor authentication for platform administrators and sensitive merchant roles.

- Log administrative access, verification decisions, campaign edits and data exports.

- Prepare breach response, vendor-risk review, backup restore tests and incident communications.

Data sovereignty should be a staged operational commitment. Version 1 may rely on reputable global managed infrastructure because reliability and security matter. Shoppage should maintain data portability, local corporate control, documented sub-processors, regional backup strategy and a roadmap for increased local or regional hosting where technically and economically justified.


# 24. Metrics and management system

The launch must be governed by evidence. Registrations, raw listings and video views are supporting metrics, not proof of a functioning commerce platform.


## 24.1 Month-three launch thresholds


# 25. 0-3 month implementation roadmap

The implementation plan assumes a senior team, strict product ownership, managed infrastructure, AI-assisted engineering and daily access to merchants for validation. It delivers one commercially operable release across all five layers by the end of week 12.


## 25.1 Parallel non-engineering workstream


## 25.2 Scope exclusions protecting the deadline

- No owned delivery fleet or warehouse.

- No universal multi-vendor cart or complex split settlement.

- No unrestricted live streaming.

- No public political advertising.

- No national rollout before Harare supply quality is proven.

- No advanced loyalty game or subsidy programme.

- No uncontrolled web scraping or private social-data collection.

- No microservices decomposition unless a proven technical constraint requires it.

- No separate native iOS and Android applications before PWA validation.


# 26. 4-6 month expansion roadmap

Months four to six expand a working system. They should not be used to finish essential version 1 features that were allowed to slip without an explicit decision.

Expansion into South Africa should not begin during months four to six unless Zimbabwe execution is materially ahead of plan and a specific funded opportunity exists. The model should be designed for multi-country support, but the organisation should not split focus before local network effects and revenue are visible.


# 27. Governance and decision rights

A platform with advertising, creators, trust decisions and national ambitions needs explicit decision rights. Founder control alone is insufficient once campaigns, complaints and public partnerships scale.

Public-sector partnerships should be documented, time-bound and transparent. Shoppage should avoid dependence on a single ministry, political sponsor, telecom operator, bank or advertising customer. Commercial ranking and moderation rules must remain platform-governed and publicly described.


# 28. Risk register and mitigation

The model is ambitious. The principal risks are operational, not conceptual.


# 29. Decision gates

Management should stop, narrow or change direction when evidence contradicts assumptions. Commitment to the mission does not justify ignoring poor unit economics or buyer trust.


# 30. Final business model

Shoppage is Zimbabwe-owned commerce media infrastructure. Shoppage Central turns merchants into structured commerce nodes. Shoppage Showcase turns products, places and short videos into local buyer discovery. Shoppage Ads captures measurable commercial attention. Shoppage Creators turns local influence and content capability into attributable income. Shoppage Markets digitises dense commercial destinations and communities.

The model stands above a conventional marketplace because it does not depend on native checkout to create value. It stands above classifieds because sellers become persistent, verified operating entities rather than isolated posts. It stands above social media for commerce because content is attached to fresh catalogues and measurable outcomes. It stands above a directory because buyers can search actual products, watch demonstrations, submit demand and contact relevant vendors. It stands above a pure advertising platform because it owns the local commerce graph needed to target purchase intent.


# 31. Immediate executive actions

The following decisions should be completed before the first development sprint begins.

1. Approve Shoppage as the master brand and commission trademark/domain checks.

1. Approve the five-layer architecture and the shared horizontal engines.

1. Appoint one accountable product owner with authority to enforce scope.

1. Select the 0-3 month budget mode and secure the full launch runway.

1. Recruit the senior engineering lead, product designer and merchant-operations lead.

1. Confirm the Home, Power and Building launch wedge and Harare pilot zones.

1. Secure 30 anchor merchants and at least one market partner before week 2 ends.

1. Commission legal review of data protection, consumer, advertising, creator and marketplace terms.

1. Create the 1,000-entity register schema and assign field ownership.

1. Approve the week-12 launch thresholds and stop/go decision process.


# Appendix A. Version 1 product requirements by layer

This appendix converts the model into a compact release checklist.


# Appendix B. Core data entities

The entity model should be agreed before rapid AI-assisted coding begins. Inconsistent naming and relationships will otherwise create expensive migrations.


# Appendix C. Analytics event standard

Events must be defined before launch so merchant and advertiser reports are comparable.


# Appendix D. Evidence base and source notes

The business model uses the prior Shoppage baseline and current public evidence. The sources below support the principal market, platform and infrastructure assumptions; they are not a substitute for the 1,000-entity field register.

1. Existing Shopscene / ShopPage consolidated business model and technology baseline - Local uploaded project document.

2. Zimbabwe - eCommerce, U.S. International Trade Administration, last published 26 March 2026 - https://www.trade.gov/country-commercial-guides/zimbabwe-ecommerce

3. Digital 2026: Zimbabwe, DataReportal - https://datareportal.com/reports/digital-2026-zimbabwe

4. Zimbabwe eTrade Readiness Assessment, UN Trade and Development - https://unctad.org/publication/zimbabwe-etrade-readiness-assessment

5. FinScope MSME Survey Zimbabwe 2022 - https://www.finscope.co.za/

6. Ownai Marketplace - https://www.ownai.co.zw/

7. Classifieds.co.zw - https://www.classifieds.co.zw/

8. Shop@Zim - https://shopatzim.co.zw/

9. HyperMarket Zimbabwe - https://hypermarket.co.zw/

10. Google Merchant Center - Local inventory ads and free local listings - https://support.google.com/merchants/answer/14615117

11. YouTube Shopping affiliate programme overview - https://support.google.com/youtube/answer/13376398

12. TikTok Shop Affiliate Marketing - https://seller.tiktokglobalshop.com/business/en/affiliate

13. Cloudflare Stream documentation and pricing - https://developers.cloudflare.com/stream/

14. Mux video pricing - https://www.mux.com/pricing

15. Supabase Storage documentation - https://supabase.com/docs/guides/storage

16. Reserve Bank of Zimbabwe publications and payment-system reports - https://www.rbz.co.zw/

17. Postal and Telecommunications Regulatory Authority of Zimbabwe reports - https://www.potraz.gov.zw/

18. Zimbabwe legal and statutory materials - Veritas - https://www.veritaszim.net/


# Appendix E. National impact scorecard for public engagement

This scorecard should be populated with live evidence before any presidential or national endorsement request.

END OF PART I - CORE IMPLEMENTATION BLUEPRINT

PART II

STRATEGIC SUPERIORITY, COMMERCE INTELLIGENCE AND INVESTOR DEFENSIBILITY

This part is integral to the business model. It converts the ambition to outclass local and global alternatives into implementable product systems, proprietary assets, operating disciplines and measurable gates.


# Part II contents

The following chapters define what must be true for Shoppage to become difficult to reproduce, nationally useful, continuously improving and investable.

- 32. Non-negotiable Shoppage doctrine

- 33. The difficult-to-copy moat system

- 34. Zimbabwe Commerce Intelligence Graph

- 35. Intelligence products unavailable through ordinary search

- 36. International product and service quality standard

- 37. Continuous competitor matching and improvement system

- 38. AI-native platform and operating model

- 39. Investor-proof company architecture

- 40. Existing-player analysis and outclass strategy

- 41. Daily utility and responsible habit formation

- 42. Twenty-four additional strategic product ideas

- 43. Practical 0-3 month implementation upgrade

- 44. Months 4-6 expansion and compounding plan

- 45. National legitimacy, endorsement and public-value safeguards

- 46. Organisational model, talent and operating cadence

- 47. Strategic KPI and proof framework

- 48. Final non-negotiable decision statement

- Appendix F. Commerce graph entities and intelligence claims

- Appendix G. AI evaluation and safety gates

- Appendix H. Competitive benchmark references


# 32. Non-negotiable Shoppage doctrine

The following requirements are not marketing language. Each one creates a product obligation, a data obligation, an operating obligation and a proof metric.


# 33. The difficult-to-copy moat system

No single feature creates defensibility. Shoppage requires a layered moat in which every additional merchant, product, buyer request, creator, market and verified outcome improves the system for all other participants.


## 33.1 The nine compounding moats


## 33.2 Copy-resistance rules

- Every public-facing feature must strengthen at least one proprietary asset: structured data, verified identity, demand history, trust, workflow adoption, distribution or outcomes.

- Do not expose bulk proprietary intelligence through unrestricted APIs. Publish useful results while controlling high-value exports, rate limits, licensing and provenance.

- Allow merchant data portability and lawful user rights, but preserve derived platform signals, aggregate models and fraud controls as Shoppage intellectual property where legally permissible.

- Prefer workflows that solve recurring jobs. A copied interface has limited value if merchants still use Shoppage to manage the underlying catalogue, campaigns, leads and reputation.

- Create field and partner processes that produce unique information: stall mapping, branch verification, stock confirmation, payment methods, delivery areas and market operating conditions.

- Use canonical IDs, historical versions and evidence links. A competitor scraping a current page should not obtain the longitudinal intelligence behind the current answer.


## 33.3 Defensibility milestone gates


# 34. Zimbabwe Commerce Intelligence Graph

The central proprietary asset is the Zimbabwe Commerce Intelligence Graph: a versioned, evidence-backed representation of who sells what, where it is available, in which variant, at what price, under which conditions, to whom, with what trust and with which unmet demand.


## 34.1 What the graph must know


## 34.2 Evidence and provenance architecture

Every material fact must be stored as a claim with source, timestamp, confidence and responsible actor. Shoppage should avoid one editable field that silently overwrites history. The system should distinguish what a merchant declared, what a field agent observed, what a buyer reported, what an integration supplied and what an AI model inferred.


## 34.3 Data-quality score

Each entity and listing should receive a data-quality score composed of completeness, freshness, provenance strength, verification, consistency and user feedback. Ranking, advertising eligibility and intelligence outputs should depend on this score. The platform should expose understandable status labels such as Verified Location, Stock Confirmed Today, Price Valid Until, Vendor Responds Within Two Hours and Customer-Corrected.


# 35. Intelligence products unavailable through ordinary search

Google can identify pages and places, but Shoppage should answer operational Zimbabwean commerce questions that require fresh structured data, local context and transaction-adjacent evidence.


## 35.1 Shopper intelligence

- Where can I find this exact model or compatible substitute today, within my travel or delivery radius?

- Which verified seller has recently confirmed stock, responds quickly and accepts my preferred payment method?

- What is the realistic local price range, how recently were prices confirmed and what explains the difference?

- Which bundle, size, grade or variant is appropriate for my use case and budget?

- Can I collect today, reserve, request delivery, ask for installation or obtain multiple quotes?

- Which nearby market has the highest concentration of the products I need so I can minimise travel?

- What locally manufactured or locally supplied alternative can replace an imported product?


## 35.2 Merchant intelligence

- What are buyers searching for in my area that I do not currently stock?

- Which of my products are viewed but not generating contact, and what content, price, trust or availability problem may explain the gap?

- Which suburbs, market clusters and delivery areas are producing profitable demand?

- Which product variants are under-supplied, overpriced, frequently requested or commonly substituted?

- How does my response speed, freshness, catalogue quality and conversion compare with anonymised category benchmarks?

- What should I promote today, what budget is justified and which creator or market is most relevant?

- Which customers or leads require follow-up without exposing private data to unrelated advertisers?


## 35.3 Market, brand and national intelligence


## 35.4 Shoppage Intelligence product line

- Shoppage Ask: Natural-language buyer assistant grounded only in graph evidence, with sources, confidence and direct actions.

- Price Pulse: Local price ranges, movement, confirmation dates and alerts; not a claim that every seller is comparable.

- Stock Truth: Recently confirmed availability, probability of availability and rapid merchant confirmation requests.

- Demand Radar: Merchant view of searches, requests and unmet demand by category and coarse location.

- Market Lens: Market-level supply, content, demand, trust, response and campaign intelligence.

- Brand Lens: Distributor and brand dashboard for reseller coverage, stock gaps and attributed activation.

- Business Improvement Copilot: Prioritised weekly recommendations tied to measurable merchant outcomes.

- Zimbabwe Commerce Observatory: Privacy-safe aggregate reports on digitisation, local supply and market activity, released with methodology.


# 36. International product and service quality standard

A Zimbabwe-first platform must meet global platform expectations while adapting to data cost, addressing, currency, trust and informal-commerce realities. Local relevance is an additional standard, not permission for poor execution.


## 36.1 Global benchmark, Zimbabwe adaptation


# 37. Continuous competitor matching and improvement system

Shoppage must be organised to absorb useful competitor features without destabilising the platform or losing its Zimbabwean advantage. This requires an operating system for improvement, not founder-driven feature reactions.


## 37.1 Product architecture for rapid improvement

- One canonical commerce data model shared across Central, Showcase, Ads, Creators and Markets.

- Modular monolith boundaries with explicit contracts so a domain can later be extracted without rewriting the platform.

- API-first business logic and versioned contracts for web, mobile, partner and AI interfaces.

- Design tokens and reusable components so global-quality interface improvements propagate consistently.

- Feature flags by user, merchant, category, city and market so experiments can be reversed safely.

- Event instrumentation defined before feature release, with dashboards linked to a decision hypothesis.

- Provider adapters for search, AI, messaging, payments, maps, storage and video to limit lock-in.

- Automated tests, migrations, security checks, preview environments and controlled releases for AI-assisted development.


## 37.2 Competitor intelligence cadence


## 37.3 Feature decision rule

A competitor feature should be copied only when it solves a verified Shoppage job, can be operated safely, strengthens the graph or revenue, and has a measurable adoption path. Novelty alone is not a priority. A feature that increases entertainment time but produces no commerce value should not outrank search quality, freshness, trust or merchant response.


# 38. AI-native platform and operating model

AI should be distributed through the product and company rather than isolated in one assistant. The first objective is to lower the cost of building and maintaining the commerce graph; the second is to improve matching, decisions, content and operations.


## 38.1 AI capability stack


## 38.2 AI-assisted development without fragile software

- AI may generate code, tests, schemas, migrations, documentation and UI variants, but a human owner approves architecture and production changes.

- Use typed contracts, linting, automated tests, security scanning, database migration review and preview deployments as mandatory gates.

- Keep business rules in explicit services and policies rather than hidden prompts. Prompts are versioned artefacts with owners and evaluation results.

- No direct production database changes by coding agents. All changes pass through migrations, review and backup validation.

- Use retrieval and tool calling against the commerce graph; do not let models invent prices, stock, verification or merchant claims.

- Maintain provider portability and cost ceilings. Expensive models should be reserved for tasks where cheaper models or deterministic rules fail.


## 38.3 Model evaluation programme


# 39. Investor-proof company architecture

Long-term investors need proof that Shoppage can become a large, defensible company without depending on endless subsidies, political access or a single transaction model.


## 39.1 Investment thesis

- Large fragmented market: commerce exists across formal retail, informal trade, markets, services, social channels and diaspora demand, but the information and advertising layers are fragmented.

- Capital-efficient wedge: Shoppage creates value from discovery, leads, advertising, content and merchant tools before carrying inventory or owning logistics.

- Multiple reinforcing revenue lines: subscriptions, managed digitisation, local ads, leads, creator campaigns, market programmes, intelligence and later transaction services.

- Proprietary compounding asset: the verified commerce graph becomes more valuable as supply, demand, trust and outcomes accumulate.

- Expansion logic: the platform can expand by city, category and country using the same core architecture while maintaining local taxonomies and operating partners.

- National-value alignment: merchant digitisation, creator income, local ad retention and local-industry visibility can attract institutional partnerships without becoming government-dependent.


## 39.2 Investor proof milestones


## 39.3 Revenue-quality hierarchy

The highest-quality early revenue is repeatable and evidence-linked: recurring merchant plans, repeat advertising, market subscriptions and managed campaigns with improving delivery margin. Onboarding services are valuable for adoption and cash flow but should become standardised. Lead fees and commissions require auditable definitions. Data products must be aggregate, lawful and methodologically credible. Grants or public programmes may accelerate inclusion but should not mask weak commercial demand.


## 39.4 Investor risk controls

- No national launch before category-city density and operational trust are proven.

- No large fixed logistics fleet during the first six months; integrate partners and collection networks.

- No broad checkout obligation before repeated remote-buying demand and dispute capability exist.

- No exclusive political or institutional dependency that compromises neutrality or commercial decisions.

- No unsupported “AI valuation” narrative; report AI cost savings, quality lift and adoption using operational evidence.

- No unbounded media cost; enforce video duration, encoding, retention and unit-cost telemetry.

- No single cloud, payment, mapping or AI provider embedded without an adapter and documented migration path.


# 40. Existing-player analysis and outclass strategy

Shoppage should respect existing platforms and analyse their strengths accurately. The objective is not to claim that competitors have no value; it is to build a broader and more operationally useful Zimbabwean commerce system.


## 40.1 What Shoppage must never do

- Compete with Facebook by attempting to recreate a full friends-and-family social network.

- Compete with Google by indexing the entire open web instead of owning local commercial depth.

- Compete with WhatsApp by forcing all conversation into a new messenger.

- Compete with established marketplaces only through more categories and copied storefront templates.

- Use vague “verified” badges with no published verification scope.

- Claim every product is available merely because a listing exists.

- Promise national coverage while operating only an unverified Harare catalogue.


## 40.2 Positioning statement


# 41. Daily utility and responsible habit formation

Shoppage should become a frequent-use product because it saves money, time and uncertainty. The goal is voluntary habit based on recurring utility, not addiction through infinite-scroll manipulation or deceptive notifications.


## 41.1 Daily consumer reasons to return

- Nearby deals and newly confirmed stock matched to saved interests.

- Price-drop and back-in-stock alerts with clear confirmation dates.

- Saved searches and open buyer requests receiving new vendor matches.

- Short commerce videos from followed categories, creators, vendors and markets.

- Market events, new arrivals, operating changes and category spotlights.

- Household, building, school or business shopping lists with local sourcing progress.

- Reliable “open now”, collection and delivery information before travel.

- Local substitution suggestions when an imported or exact item is unavailable.

- Rewards for useful actions such as verified corrections, fulfilled-request confirmation and referrals, subject to anti-abuse controls.


## 41.2 Daily merchant reasons to return

- Confirm stock and prices in a rapid daily queue.

- Respond to leads and buyer requests before competitors.

- See demand changes and recommended products to promote.

- Publish one short product clip and distribute it to Shoppage plus external channels.

- Monitor campaign spend, creator activity and attributed outcomes.

- Follow up on saved leads and repeat customers with consented contact context.

- Receive a prioritised “three actions today” merchant copilot instead of a complex analytics dashboard.


## 41.3 Responsible engagement rules


# 42. Twenty-four additional strategic product ideas

The following ideas strengthen daily utility, data depth, inclusion, defensibility and revenue. They should be prioritised by the roadmap gates rather than launched simultaneously.


## 1. Shoppage Ask / Request Network

A buyer describes the need, budget, location and urgency; Shoppage structures the request and routes it to qualified vendors.

Strategic value: Creates demand data and works where catalogues are incomplete.


## 2. Price Pulse

Confirmed price ranges, alerts and explanations by variant, place and date.

Strategic value: Creates a trusted local reference without pretending all offers are identical.


## 3. Stock Truth

Availability confidence, last confirmation and one-tap merchant reconfirmation.

Strategic value: Makes freshness visible and turns uncertainty into a workflow.


## 4. Compatibility Graph

Maps parts, accessories, sizes, devices, vehicles, systems and substitutes.

Strategic value: High-value intelligence for auto, electronics, solar and hardware.


## 5. Merchant Reputation Passport

Portable Shoppage history of verification, response and fulfilled outcomes.

Strategic value: Rewards good operators and creates time-based switching value.


## 6. Verified Collection Network

Approved shops, market desks or partner points for collection and identity checks.

Strategic value: Improves trust without owning a national fleet.


## 7. Market Captain Programme

Trained operators digitise a market, maintain rosters, verify changes and sell campaigns.

Strategic value: Creates local operations and a scalable distribution network.


## 8. Field Agent Micro-franchise

Agents earn from onboarding, verification, content capture and catalogue maintenance.

Strategic value: Extends reach beyond self-service merchants.


## 9. Universal ShopPage Link and QR

One link/QR resolves to live catalogue, location, contacts, videos and offers.

Strategic value: Makes Shoppage the merchant identity shared everywhere.


## 10. WhatsApp and Voice Ingestion

Merchants send a photo, voice note or price list; AI drafts structured updates for confirmation.

Strategic value: Matches existing behaviour and reduces dashboard friction.


## 11. Low-data and Assisted Access

Text-first mode, compressed media, agent-assisted onboarding and optional messaging notifications.

Strategic value: Improves inclusion under connectivity constraints.


## 12. Diaspora Purchase Concierge

Verified local quotes, recipient confirmation, proof of collection/delivery and dispute support.

Strategic value: Captures high-value remote demand without immediate full marketplace complexity.


## 13. B2B Procurement Exchange

Businesses and institutions request quotes, compare verified suppliers and preserve audit trails.

Strategic value: Creates valuable demand and supplier intelligence.


## 14. Made in Zimbabwe Discovery

Dedicated local-manufacturer, producer and artisan graph with substitution and distribution tools.

Strategic value: Supports local industry and national-value positioning.


## 15. Local Substitution Engine

Recommends locally available alternatives when exact/imported items are unavailable.

Strategic value: Reduces failed searches and exposes domestic capability.


## 16. Proof-backed Reviews

Reviews linked where possible to a verified lead, visit, reservation or fulfilment event.

Strategic value: Higher trust than unrestricted anonymous ratings.


## 17. Live Commerce Rooms

Scheduled vendor/creator demonstrations with tagged products and moderated questions.

Strategic value: Combines content, trust and concentrated campaign demand.


## 18. Commerce Academy

Short practical lessons and capability scoring for product data, response, video, pricing, trust and ads.

Strategic value: Improves merchant performance and creates certification signals.


## 19. Business Improvement Score

Private diagnostic with recommended actions and benchmark ranges.

Strategic value: Turns intelligence into measurable merchant development.


## 20. Open Partner APIs

Controlled APIs for banks, distributors, logistics, malls, POS systems, agencies and public programmes.

Strategic value: Embeds Shoppage in external workflows and increases switching cost.


## 21. Shoppage Ad Credits

Prepaid promotional balance, vouchers and partner-sponsored merchant activation, without becoming a deposit-taking wallet.

Strategic value: Simplifies small campaign purchases and institutional programmes.


## 22. Demand Bounties

Brands or markets sponsor rewards for creators and agents who fulfil verified catalogue or content gaps.

Strategic value: Directs ecosystem effort to valuable missing data.


## 23. Community Correction Network

Users report closed stores, wrong prices or moved stalls; trusted corrections earn recognition or limited rewards.

Strategic value: Improves the graph while using anti-abuse review.


## 24. Commerce Continuity View

During shortages, outages or emergencies, surface verified essential availability, delivery changes and open suppliers.

Strategic value: Creates legitimate public utility and resilience.


# 43. Practical 0-3 month implementation upgrade

A three-month launch is feasible only as a tightly controlled city-category implementation. “Fully functional” means each layer completes its core job end to end, the graph and trust systems are real, and the operating team can maintain the service. It does not mean nationwide exhaustive coverage or every long-term idea.


## 43.1 Version 1 scope lock


## 43.2 Week-by-week build and operating plan


## 43.3 Minimum launch team


## 43.4 Week-12 launch gates


# 44. Months 4-6 expansion and compounding plan

Expansion should deepen the moat before increasing geographic and category breadth. The company must prove that the launch system can be repeated without a proportional increase in manual effort.


## 44.1 Expansion rule


# 45. National legitimacy, endorsement and public-value safeguards

A platform capable of national endorsement must be demonstrably useful, neutral, lawful and professionally governed. Presidential endorsement may be valuable, but the model must remain viable without it and must never imply access to private citizen commerce data.


## 45.1 Public-value case

- Improve discoverability and digital capability for MSMEs, informal traders, markets, manufacturers and service providers.

- Retain a greater share of advertising, campaign work, creator income and commercial data value in Zimbabwe.

- Create youth income in onboarding, content, market digitisation, support, data quality and software operations.

- Give consumers more reliable product, place, price, trust and availability information.

- Increase visibility of locally manufactured goods and substitution opportunities.

- Produce transparent aggregate evidence on commercial digitisation and market gaps.


## 45.2 Non-partisan and rights safeguards

- No political advertising during the initial operating period; any future policy requires separate legal, safety and governance review.

- No government, party or sponsor receives privileged access to personal search, purchasing, location or merchant-performance data.

- Public-sector dashboards use minimum necessary aggregation, suppression and documented methodology.

- Commercial ranking remains governed by published relevance, quality, trust and sponsored-placement rules.

- Endorsement, partnership or grant relationships are disclosed and do not confer ownership of user data.

- Complaints, delisting and verification decisions include evidence, audit history and appeal where appropriate.


## 45.3 Endorsement-readiness evidence pack


# 46. Organisational model, talent and operating cadence

Shoppage’s competitive advantage must exist in the company, not only in the product. A national commerce intelligence platform requires disciplined product development, field execution, data governance, trust operations and commercial delivery.


## 46.1 Core operating units


## 46.2 Operating cadence


# 47. Strategic KPI and proof framework

The executive dashboard must measure whether Shoppage is becoming more useful, more defensible and more investable. Registration, total listings and video views are supporting metrics, not the definition of success.


## 47.1 North-star metric


# 48. Final non-negotiable decision statement

Shoppage must be built as Zimbabwe’s commerce intelligence and activation infrastructure, not as another catalogue website. The public product is the visible layer; the durable company is the commerce graph, merchant operating system, trust history, demand engine, creator and market distribution network, advertising outcomes and continuous-learning capability beneath it.

The platform should be capable of answering commercial questions that ordinary web search cannot answer reliably: exact local availability, variant compatibility, current conditions, trusted alternatives, market concentration, response capability, unmet demand and practical improvement opportunities. It must present those answers with evidence, freshness and uncertainty rather than false certainty.

Global quality is mandatory. The interface, speed, reliability, search, accessibility, security, content, support and analytics must be credible against international platforms. Zimbabwe-specific constraints should shape the solution - low-data operation, manual location, assisted onboarding, WhatsApp hand-off, multiple payment methods and field verification - without lowering the standard.

The three-month objective is a fully functioning, dense Harare launch system across all five layers with the core intelligence graph, trust, ads, creators and markets working. Months four to six deepen intelligence, repeat revenue, second-city replication and selected transaction support. National breadth follows evidence, not ambition alone.


# Appendix F. Commerce graph entities and intelligence claims

This appendix is a minimum modelling checklist for engineering and data governance. Each item requires a canonical ID, lifecycle, ownership, provenance and access policy.


# Appendix G. AI evaluation and safety gates

AI release quality must be measured against real Zimbabwean commerce data and user impact.


# Appendix H. Competitive benchmark references

The following current public examples support the benchmark design. They should be supplemented by the ongoing 1,000-entity Zimbabwe field and platform register.

1. Classifieds.co.zw - broad categories, free ads, deals and suburb selection - https://www.classifieds.co.zw/

2. Ownai Marketplace - broad retail catalogue, cart, comparison, seller access and adjacent services - https://ownai.co.zw/

3. Shop@Zim - multi-vendor positioning, verified suppliers, quotes, local products and delivery messaging - https://shopatzim.co.zw/

4. Google Merchant Center local inventory ads and local listings - https://support.google.com/merchants/answer/14615117

5. YouTube Shopping affiliate programme and tagged product content - https://support.google.com/youtube/answer/13376398

6. TikTok Shop affiliate marketing for sellers and creators - https://seller.tiktokglobalshop.com/business/en/affiliate

7. Existing Shoppage / Shopscene consolidated business and technology baseline - Local project document: Shopscene Business Model Recap.txt

PART II CONTINUES - OPERATING AND FINANCIAL DEPTH


# 49. National knowledge acquisition and 1,000-entity execution programme

Shoppage cannot become aware of Zimbabwean commerce through desk research alone. The graph must be built through a repeatable national acquisition system that combines merchant self-service, field verification, public-source discovery, partnerships, customer corrections and AI-assisted normalisation. The initial 1,000-entity programme is not a publicity number; it is a controlled learning and coverage instrument.


## 49.1 Register design


## 49.2 Collection channels

- Merchant self-registration with progressive verification and AI-assisted catalogue creation.

- Field-agent and market-captain visits with evidence capture, geolocation and supervisor sampling.

- Public Facebook page, public group and website discovery used to identify entities and draft records, subject to terms, law and merchant confirmation.

- Partner feeds from markets, brands, distributors, payment providers, logistics providers and associations under explicit data agreements.

- Buyer requests and failed searches that create structured demand and expose missing suppliers or variants.

- Community corrections and merchant claims of existing pages, with dispute and ownership verification.

- Import tools for spreadsheets, POS exports, catalogues, product images, PDFs and approved APIs.


## 49.3 Field protocol


## 49.4 Coverage scoring

Coverage must be measured by usefulness rather than entity count. A category-area cell is “usable” only when it has enough verified and responsive supply, variant representation, fresh offers and buyer actions to resolve common needs. Management should maintain a coverage matrix by city, area, category and trust tier. Empty cells become acquisition priorities; weak cells trigger market captains, distributor outreach or buyer-request routing rather than fabricated completeness.


# 50. Layer-by-layer implementation requirements

The five layers must behave as one product system. Each layer has a primary job, a proprietary asset contribution, a revenue role and a week-12 completion test.


## 50.1 Shoppage Central detailed release criteria

- Organisation, owner, staff and role model with tenant isolation and complete audit history.

- Business, store, branch, stall, pickup point, hours, location, contact, service area, payment and delivery records.

- Category templates for products, variants, services, prices, currencies, minimum orders, promotions, lead times and stock states.

- Image, short video, document and rights records with compression, moderation and product tagging.

- Freshness queue, bulk confirmation, expiry, customer correction and category-specific policies.

- Lead inbox for WhatsApp, calls, RFQs, creator referrals, market sources and outcomes.

- Merchant copilot with three prioritised actions and evidence, never automatic spend changes.

- Plan, entitlement, invoice, ad credit and managed-service request model.


## 50.2 Showcase detailed release criteria

- Keyword, typo-tolerant and semantic search with local aliases and category facets.

- Manual and optional GPS location, radius, service area, market and route-based discovery.

- Product, business, branch, market, creator and collection pages with freshness and trust labels.

- Low-data image mode, short-video feed, captions, product tags and finite “up to date” state.

- Saves, comparisons, lists, price/stock alerts and open-now/available-today filters.

- Buyer request with category, description, budget, location, urgency, attachments and consented contact.

- Grounded Shoppage Ask answers with evidence links, confidence and direct next action.


## 50.3 Ads detailed release criteria

- Objectives: visibility, product view, catalogue visit, WhatsApp/call, RFQ and market visit intent.

- Objects: product, store, branch, video, collection, creator collaboration, market and event.

- Targeting: category, city/area, market, keyword/context, delivery area and selected first-party interest.

- Buying: simple fixed packages, daily/total budget, dates, prepaid credits and managed campaign request.

- Controls: stale-stock block, misleading claim checks, sponsored labels, frequency caps and organic safeguards.

- Reports: reach, view, click, contact, request, response, outcome, spend and cost per qualified action.


## 50.4 Creators detailed release criteria

- Creator identity, categories, locations, channels, content examples, audience declaration and verification.

- Product/merchant discovery, campaign briefs, sample request, terms, disclosure and content approval.

- Tagged links, QR/codes, attribution windows, lead validation, disputes and earnings ledger.

- Content studio for captions, price/location overlays, product tags, rights and reuse exports.

- Quality tiers based on valid outcomes, content quality, disclosure and dispute history rather than followers alone.


## 50.5 Markets detailed release criteria

- Market entity, operator, boundary, access, hours, transport/parking notes, contacts and verification.

- Member roster, branch/stall positions, categories, trust, onboarding status and maintenance ownership.

- Combined product/video feed, market search, map, buyer requests, events, offers and announcements.

- QR signage and trackable entrances/sections, sponsor inventory, campaigns and market analytics.

- Market captain queue for new members, moved stalls, hours, closures, disputes and content gaps.


# 51. Financial architecture and investor scenario logic

The financial model must separate software gross margin, managed-service labour, media delivery cost, field acquisition cost and partner pass-throughs. Revenue growth without this separation can conceal an agency-heavy or infrastructure-heavy business.


## 51.1 Revenue engines and economic character


## 51.2 Scenario discipline

The board should maintain conservative, base and ambitious scenarios driven by active merchants, merchant revenue, repeat advertisers, managed-service capacity, creator/market revenue and gross margin. The model should not assume that all registered sellers pay, all ad impressions monetise or all leads become sales. Each scenario must expose cash needs, hiring triggers and the operational work required to achieve the numbers.


## 51.3 Unit economics dashboard

- Cost per verified active merchant, separated into sales, field, data, support and incentives.

- Time and cost to create the first useful catalogue and first shoppable clip.

- Merchant activation-to-first-lead time and percentage receiving value within 14 days.

- Monthly gross revenue and gross contribution per active merchant by revenue type.

- Advertiser first-to-repeat conversion, campaign service hours and media cost.

- Creator valid-action cost, payout ratio, dispute rate and campaign margin.

- Market onboarding cost, member activation, sponsorship revenue and maintenance cost.

- Buyer acquisition source, repeat rate and cost per verified commerce outcome.

- AI cost per extracted item, matched request, moderated object and assistant answer, with human-correction cost.


# 52. Category and city launch playbook

Each category requires its own taxonomy, freshness, trust, media, search, pricing and conversion logic. Shoppage should not treat a solar inverter, a bag of cement, a plumbing service and a fashion item as equivalent listings.


## 52.1 Home, Power and Building launch wedge


## 52.2 Category readiness checklist

- Named category owner and taxonomy approved with merchant experts.

- Minimum useful supply density by target area and a clear acquisition list.

- Required attributes, aliases, variants, compatibility and substitution rules.

- Freshness window, price volatility and stock-confirmation method.

- Trust risks, prohibited claims, counterfeit/safety issues and verification scope.

- Buyer actions, RFQ structure, expected response time and outcome definition.

- Creator content formats, ad units, benchmarks and likely willingness to pay.

- Media cost, search evaluation set, support guide and dispute playbook.


## 52.3 City replication checklist

- Local commercial lead and field/market-captain capacity.

- Anchor merchants, market partner and distribution channels secured before public launch.

- Area, suburb, landmark, route and market geography verified.

- Buyer demand evidence and category gap map.

- Local support, verification and complaint response coverage.

- Launch budget, stop conditions and weekly scorecard.


# 53. Security, privacy, intellectual property and compliance architecture

The intelligence moat has value only if merchants, consumers, creators, partners and investors trust Shoppage to govern it. Security and privacy are product requirements, while intellectual property protection must coexist with user rights, lawful portability and fair merchant treatment.


# 54. Product, data and operating service levels

Global quality requires explicit service expectations. Initial targets should be demanding but realistic, then tightened as evidence and infrastructure improve.

EXECUTIVE CHARTER FOLLOWS


# 55. Executive twenty-point commitment and anti-failure charter

This charter converts the full model into decisions that the board, founders, product team and operating leaders can enforce. It should be signed off before implementation and used to reject shortcuts that create a visually impressive but strategically weak platform.

The charter is intentionally restrictive. Shoppage’s opportunity is large enough that weak focus, poor data quality, political dependency, copied features or uncontrolled expansion could consume significant capital without producing a defensible platform. The discipline above protects the national ambition by forcing every phase to create real utility and cumulative advantage.

END OF COMPLETE SHOPPAGE NATIONAL COMMERCE MODEL


# Tables


| Central decision Shoppage will not launch as another generic marketplace. It will launch as Zimbabwe-owned commerce media infrastructure: a mobile merchant operating system, geolocal product and short-video discovery network, local advertising exchange, creator-affiliate economy and market-in-market platform. The first three months deliver a commercially operable version across all five layers; months four to six expand geography, categories, partnerships and transaction depth. |

| --- |



| Item | Decision | Operating implication |

| --- | --- | --- |

| Master brand | Shoppage | All trust, demand and advertising equity compounds into one Zimbabwean brand. |

| Launch horizon | 0-3 months | A tightly scoped but fully functional version 1 across all five layers. |

| Expansion horizon | 4-6 months | New cities, categories, transaction tools, institutional and brand partnerships. |

| Primary market | Zimbabwe | Harare first, then Bulawayo and selected commercial corridors. |

| Secondary market | South Africa later | No dilution of Zimbabwe execution before local proof. |

| Business category | Commerce media infrastructure | Not merely e-commerce, classifieds, social media or advertising software. |



| Research integrity The strategy synthesises the existing Shoppage baseline, prior deep-research direction, public Zimbabwe market evidence and global platform patterns. It does not fabricate a completed line-by-line audit of 1,000 companies. A traceable 1,000-entity Zimbabwe commerce register is therefore included as a mandatory field-validation workstream within the 0-3 month programme. |

| --- |



| 1. Executive decision  3 | 19. Trust and consumer protection  18 |

| --- | --- |

| 2. Zimbabwe ground reality  3 | 20. Payments and logistics  19 |

| 3. National value proposition  4 | 21. AI operating model  20 |

| 4. Brand and product architecture  5 | 22. Technology architecture  20 |

| 5. Shoppage Central  6 | 23. Data governance and security  21 |

| 6. Shoppage Showcase  7 | 24. Metrics and management  22 |

| 7. Shoppage Ads  8 | 25. 0-3 month roadmap  23 |

| 8. Shoppage Creators  10 | 26. 4-6 month expansion  24 |

| 9. Shoppage Markets  11 | 27. Governance and decision rights  24 |

| 10. Shared horizontal engines  11 | 28. Risk register  25 |

| 11. Priority users  12 | 29. Decision gates  25 |

| 12. Commercial journeys  12 | 30. Final business model  26 |

| 13. Competitive strategy  13 | 31. Immediate executive actions  26 |

| 14. Network effects and moat  14 | Appendix A. Product requirements  26 |

| 15. Revenue and pricing  15 | Appendix B. Core data entities  27 |

| 16. Delivery budget and model  16 | Appendix C. Analytics events  27 |

| 17. Go-to-market strategy  17 | Appendix D. Evidence base  28 |

| 18. Field operations + 1,000 register  18 | Appendix E. National impact scorecard  28 |



| North-star proposition For buyers: find what is available, where it is, who can be trusted and how to buy it. For merchants: publish once, sell everywhere and measure every lead. For Zimbabwe: retain more commerce data, advertising value, creator income and digital capability inside the country. |

| --- |



| Layer | Version 1 completion test | Deferred depth |

| --- | --- | --- |

| Central | A merchant can register, verify, create a storefront, manage products, prices, stock, branches, leads and analytics. | Advanced ERP, accounting and warehouse management. |

| Showcase | A buyer can search, browse nearby products, watch shoppable clips, compare, save, request a quote and contact a vendor. | Full entertainment social network and complex personalisation. |

| Ads | A merchant can fund a campaign, choose a simple objective and audience, receive placement and see results. | Real-time programmatic exchange and external web ad network. |

| Creators | A creator can join, tag approved products, publish tracked content and earn from verified outcomes. | Large-scale automated payouts and live-stream commerce. |

| Markets | A market administrator can create a market, onboard stalls, publish a shared feed and measure demand. | Deep market ERP, rent collection and municipal systems. |



| Observed reality | Business implication | Product response |

| --- | --- | --- |

| Social media is the dominant commerce entry point. | Shoppage cannot depend on app-store installation or behaviour change at launch. | PWA, shareable links, WhatsApp handoff and social export are core. |

| Many sellers are informal or have no website. | Self-service software alone will underperform. | Assisted onboarding, field agents, market captains and creator support. |

| Product posts become stale quickly. | A large catalogue can still be commercially useless. | Price-valid-until, last-confirmed stock and automated freshness decay. |

| Trust is social and location-based. | A generic verified badge is insufficient. | Progressive KYC, location proof, response history and complaint records. |

| Payments are multi-rail and currency-sensitive. | Forced prepaid checkout will reduce conversion. | Cash, collection, mobile money, bank, card and deposit options. |

| Delivery is fragmented. | Owning a fleet would consume capital and management capacity. | Pickup first, partner quotes and proof-of-fulfilment workflows. |

| Data and connectivity vary. | Heavy video and complex interfaces will exclude users. | Low-data mode, compressed media, cached pages and simple navigation. |

| Diaspora demand is important. | Remote buyers need trust and fulfilment evidence, not only products. | Diaspora collections, verified vendors, deposits and delivery proof. |



| National objective | Shoppage contribution | Proof metric |

| --- | --- | --- |

| MSME digitisation | Low-cost storefronts, catalogues, leads and analytics for formal and informal sellers. | Active verified businesses and digital catalogues created. |

| Local value retention | Zimbabwe-owned advertising and creator revenue instead of full leakage to global platforms. | Local ad spend processed and creator/vendor income generated. |

| Youth employment | Creator commerce, field onboarding, content production, support and software roles. | Paid creators, agents and full-time jobs. |

| Devolution and local markets | Digital market pages and geo-demand intelligence for cities and districts. | Markets digitised and demand by locality. |

| Consumer protection | Seller verification, transparent prices, complaint workflows and auditable promotions. | Complaint rate, resolution time and repeat buyer trust. |

| Diaspora participation | Verified local purchasing and fulfilment evidence for remote buyers. | Diaspora leads, orders and proof-of-delivery completion. |

| Export and local industry | Supplier discovery, manufacturer profiles and B2B quote workflows. | Qualified B2B enquiries and export-ready suppliers. |

| Data sovereignty | A locally governed commerce graph and privacy-conscious national market intelligence. | Local entity ownership, compliance and controlled data access. |



| Endorsement principle Shoppage should be presented as enabling infrastructure for citizens and businesses, not as a political communications platform. No political party should receive privileged commercial ranking, private user data or moderation control. National credibility requires neutral governance, transparent policies and documented consumer safeguards. |

| --- |



| Layer | Strategic role | Primary promise |

| --- | --- | --- |

| Shoppage Central | Merchant operating system and shared platform core. | Run the business and publish a trusted digital catalogue. |

| Shoppage Showcase | Buyer-facing search, geo-discovery and commerce-content feed. | See it, locate it, compare it and contact the seller. |

| Shoppage Ads | Zimbabwean commercial advertising and campaign system. | Buy measurable local purchase intent. |

| Shoppage Creators | Creator, affiliate and content-production economy. | Turn influence and content skill into attributable income. |

| Shoppage Markets | Market-in-market layer for malls, districts, associations and clusters. | Digitise a whole commercial destination, not only one shop. |



| Workspace | Minimum functions | Operational control |

| --- | --- | --- |

| Today | Pending leads, stale listings, campaign status and recommended actions. | Prioritise tasks that affect conversion. |

| Catalogue | Products, variants, media, price, stock and bulk update. | Completeness and freshness score. |

| Content | Short clips, posts, offers, templates and export. | Rights, moderation and product linkage. |

| Leads | Contact history, status, notes, reminders and source. | Response SLA and spam handling. |

| Promote | Ad objective, budget, area, category and creative. | Approval, spend limits and transparent labelling. |

| Creators | Invite, approve products, commission and performance. | Attribution and disclosure. |

| Store | Branches, hours, payments, delivery, policies and staff. | Verification and audit log. |

| Insights | Search demand, content performance, lead conversion and location. | Privacy-safe aggregation and benchmarks. |



| Freshness state | Rule | User treatment |

| --- | --- | --- |

| Confirmed | Merchant confirmed within category-specific window. | Normal ranking and visible confirmation date. |

| Needs confirmation | Approaching expiry or unusual price movement. | Merchant reminder and slight ranking reduction. |

| Stale | No confirmation after defined threshold. | Clear warning, lower ranking and limited promotion. |

| Suspended | Repeated inaccurate availability or unresolved complaints. | Hidden from search pending review. |



| Surface | Purpose | Version 1 requirement |

| --- | --- | --- |

| Search | Resolve explicit product or supplier intent. | Typo tolerance, category, price, location, availability and trust filters. |

| Nearby | Show commercially relevant items around the buyer. | Permission-based location and manual area selection. |

| Video feed | Create discovery and demonstration. | Vertical clips linked to products and vendors. |

| Product page | Answer price, availability, specifications and fulfilment questions. | Freshness, seller trust, branches and clear contact actions. |

| Storefront | Present the seller as a durable business entity. | Catalogue, policies, hours, location and response signals. |

| Market page | Aggregate a physical or thematic market. | Vendor directory, feed, map, offers and shared search. |

| Buyer request | Capture unmet demand. | Structured RFQ and routing to matched vendors. |

| Saved | Support considered purchases. | Products, searches, markets and price/stock alerts. |



| No orphan content Every Showcase clip must link to at least one structured object: product, service, store, market, collection, offer, campaign or buyer request. Content without a commercial destination dilutes the model and increases moderation cost. |

| --- |



| Video type | Commercial use | Required controls |

| --- | --- | --- |

| Product demo | Show operation, size, quality or installation. | Product tag, current price and stock state. |

| New arrival | Create urgency around fresh inventory. | Expiry and branch association. |

| Deal alert | Promote a time-bound offer. | Offer dates and sponsored label where applicable. |

| Store tour | Build location trust and discovery. | Verified branch and opening hours. |

| Market walk-through | Expose multiple merchants in a cluster. | Market admin approval and tagged vendors. |

| Creator review | Explain, compare or recommend. | Affiliate disclosure and evidence policy. |

| How-to / guide | Educate buyers and create category demand. | Safety and claims moderation. |

| Proof of work | Show installation or completed service. | Customer consent and authenticity checks. |



| Ad product | Best use | Charging basis |

| --- | --- | --- |

| Sponsored search | Capture explicit keyword and category demand. | Cost per click or fixed budget. |

| Promoted product | Increase exposure in relevant feeds and shelves. | Optimised impressions / clicks. |

| Promoted video | Drive discovery with tagged commerce content. | Video views plus action objective. |

| Featured store | Build merchant visibility in area or category. | Fixed period or budget. |

| Market sponsorship | Own a market page, event or campaign window. | Fixed sponsorship. |

| Lead campaign | Generate quote requests, calls or WhatsApp enquiries. | Budget with cost-per-lead reporting. |

| Creator campaign | Pay selected creators to produce and distribute tagged content. | Content fee plus performance pool. |

| Diaspora campaign | Target remote buyers with verified fulfilment. | Managed campaign fee and media spend. |



| Retention lever | Mechanism | Metric |

| --- | --- | --- |

| Media revenue | Local merchants buy Shoppage inventory. | Gross ad spend and net local revenue. |

| Creator income | Creators are paid from campaigns and outcomes. | Creator payouts and active earners. |

| Agency capability | Local campaign managers and production partners. | Local service spend and jobs. |

| Data value | Demand and performance intelligence stays in Shoppage. | Local data assets and approved insight products. |

| Tax and formalisation | Revenue recorded through a compliant local entity. | Local tax and registered supplier activity. |



| Role | Value created | Earning method |

| --- | --- | --- |

| Affiliate creator | Tags and recommends approved products. | Verified lead or sale commission. |

| Content producer | Creates photos, clips, store tours and catalogues. | Fixed production fee. |

| Market creator | Covers a market, cluster or event. | Market campaign fee plus affiliate income. |

| Category expert | Produces technical guides and comparisons. | Campaign, sponsorship and lead share. |

| Onboarding agent | Digitises merchants and maintains listings. | Activation and retention payment. |

| Community distributor | Shares collections into trusted groups. | Tracked lead or campaign fee. |



| Event | Recommended treatment | Fraud control |

| --- | --- | --- |

| Qualified WhatsApp lead | Pay only after minimum engagement or vendor validation. | Phone hashing, duplicate window and vendor dispute. |

| Quote request | Higher-value commission if request is complete and matched. | Identity check and category rules. |

| Store visit intent | Use as performance signal, not immediate payout. | Optional code or check-in later. |

| Completed sale | Enable where vendor or payment flow can verify. | Order reference and cancellation window. |

| Content production | Fixed fee after acceptance. | Brief, deliverables and rights record. |



| Actor | Responsibility | Commercial arrangement |

| --- | --- | --- |

| Market owner / association | Authorises the destination, rules and shared identity. | Subscription, sponsorship or revenue share. |

| Market captain | Onboards stalls, confirms locations and maintains quality. | Activation fee and retention incentive. |

| Vendor / stall | Maintains catalogue, prices, stock and leads. | Free or paid Shoppage plan. |

| Creator | Produces market walk-throughs and collections. | Campaign or affiliate income. |

| Shoppage operations | Moderation, analytics, ads and support. | Platform fees and managed services. |



| Engine | Purpose | Non-negotiable outcome |

| --- | --- | --- |

| Identity and tenancy | Users, organisations, roles and permissions. | Every vendor-owned record is tenant-scoped and audited. |

| Catalogue graph | Products, variants, services, attributes and relationships. | Structured data that powers search, content and ads. |

| Geo engine | Locations, branches, markets, delivery and demand. | Relevant local discovery without excessive tracking. |

| Trust engine | Verification, freshness, response, reviews and complaints. | Visible, explainable trust rather than a generic badge. |

| Lead engine | WhatsApp, calls, RFQs, reservations and status. | Attribution from discovery to merchant action. |

| Content engine | Images, clips, captions, rights and moderation. | Every content item linked to commerce data. |

| Ads engine | Campaigns, placements, spend, approvals and reporting. | Transparent local commercial advertising. |

| Affiliate engine | Links, commissions, outcomes, disputes and payouts. | Auditable creator economics. |

| Analytics engine | Events, funnels, cohorts and merchant reports. | Decision-useful metrics and privacy-safe aggregation. |

| Billing engine | Plans, credits, invoices and entitlements. | Configurable pricing and multi-currency presentation. |



| Segment | Primary job | Critical adoption condition |

| --- | --- | --- |

| Independent retailer | Turn stock and social posts into searchable local demand. | Fast onboarding and visible leads. |

| Informal seller / stall | Gain a trusted digital presence without building a website. | Assistance, low cost and mobile simplicity. |

| Multi-branch merchant | Expose branch inventory and measure campaigns. | Roles, imports, branch data and reporting. |

| Wholesaler / distributor | Reach resellers and capture structured requests. | Bulk catalogue and RFQ workflows. |

| Service provider | Show proof of work and receive local enquiries. | Portfolio clips, coverage area and booking/quote request. |

| Buyer | Find an available item without contacting many sellers. | Freshness, location, price and trust. |

| Diaspora buyer | Buy or arrange fulfilment for someone in Zimbabwe. | Verified seller, remote payment and proof. |

| Creator / affiliate | Monetise content and community influence. | Reliable attribution and fair payout. |

| Market operator | Digitise the whole destination and attract traffic. | Simple administration and shared campaigns. |

| Brand / distributor | Generate demand and understand category performance. | Campaign scale, brand safety and insight. |



| Player / model | Existing strength | Shoppage response |

| --- | --- | --- |

| Facebook Marketplace, Pages and Groups | Reach, familiarity, communities and low-friction posting. | Structured catalogues, freshness, trust, search, local attribution and merchant analytics. |

| WhatsApp | Direct conversation and ubiquitous merchant behaviour. | Use it as a handoff channel while preserving product and lead context. |

| Google Search, Maps and local inventory ads | High-intent search, maps and ad infrastructure. | Zimbabwe-first product graph, market clusters, local trust and merchant assistance. |

| TikTok / Reels / Shorts | Algorithmic video discovery and creator attention. | Commerce-only clips linked to real local products, vendors and outcomes. |

| Ownai | Broad local e-commerce catalogue and checkout orientation. | Merchant operating system plus geo, media, ads, creators and markets. |

| Classifieds.co.zw | Established local listing behaviour and category breadth. | Persistent vendor identity, catalogue quality, short video, RFQ and measurable ads. |

| Shop@Zim | Verified supplier and B2B quote positioning. | Consumer plus B2B demand, geo, content, creators and market clusters. |

| HyperMarket | Conventional multi-vendor e-commerce and Paynow integration. | Lead-first flexibility, commerce media, creator attribution and market infrastructure. |

| Independent websites | Brand control and direct customer ownership. | Low-cost operating layer, network demand and shared local discovery. |

| Physical markets | Trust, availability, bargaining and dense supply. | Digitise discovery without destroying the physical market relationship. |



| Pattern | Learning | Shoppage application |

| --- | --- | --- |

| Shopify merchant OS | Merchants pay for operational control even before marketplace demand. | Central must deliver standalone merchant value. |

| TikTok Shop | Video, product tagging, creator commissions and seller tools reinforce one another. | Showcase and Creators share catalogue and attribution. |

| Google local inventory | Nearby stock and pickup convert local search into store visits. | Branch freshness and geo availability are first-class. |

| YouTube Shopping | Creators tag products while retaining content workflow and analytics. | Creator studio needs tagging, insights and commissions. |

| Meesho-style reseller distribution | Community sellers extend reach into trust networks. | Community distributors and group admins become affiliates. |

| Mercado Libre trust and payments | Trust, payments and logistics deepen only after marketplace liquidity. | Stage transactions after demand and seller quality. |

| Shopee gamification | Promotions and engagement can accelerate frequency but create subsidy risk. | Use restrained loyalty and campaign tools, not cash-burning games. |

| Amazon Inspire discontinuation | A generic shopping video feed is not automatically durable. | Video must solve local discovery and link to fresh supply. |

| Nextdoor local communities | Local relevance creates defensible engagement. | Suburb and market-based commercial discovery. |

| Jumia operational complexity | Full marketplace fulfilment can consume capital in fragmented markets. | Remain partner-led in payments and delivery initially. |



| Moat asset | How it compounds | Why it is difficult to copy |

| --- | --- | --- |

| Product graph | More structured products improve search, content and ads. | Requires continuous merchant data cleaning and freshness. |

| Geo-commerce graph | Branches, markets, pickup points and demand improve local ranking. | Requires field verification and local commercial knowledge. |

| Trust graph | Response, complaints, identity and fulfilment create reputation. | History cannot be recreated quickly by a new entrant. |

| Demand graph | Searches, saves, requests and leads reveal unmet demand. | Needs meaningful buyer and seller liquidity. |

| Content-attribution graph | Clips, creators, products and outcomes improve distribution. | Requires creator relationships and credible attribution. |

| Market graph | Associations, malls and clusters create dense local supply. | Depends on offline partnerships and operational execution. |

| Ad performance graph | Local campaign results improve targeting and merchant ROI. | Needs spend history and outcome data. |

| Operational network | Agents, captains, moderators and support maintain quality. | Field systems and trust take time to establish. |



| Revenue line | Who pays | Launch logic |

| --- | --- | --- |

| Merchant subscriptions | Vendors and service providers. | Recurring revenue after clear operational value. |

| Promoted placements | Merchants and brands. | Low-ticket, measurable local visibility. |

| Managed campaigns | Merchants, distributors and brands. | High-touch early revenue and learning. |

| Catalogue digitisation | Merchants, markets and institutions. | Solves adoption barrier and funds field operations. |

| Creator campaigns | Merchants and brands. | Content production plus performance distribution. |

| Qualified leads | High-value categories and B2B vendors. | Charge for intent when catalogues are incomplete. |

| Market packages | Malls, associations and commercial clusters. | Dense onboarding and shared promotion. |

| Data intelligence | Brands, distributors and institutions. | Only aggregated, privacy-safe and sufficiently representative. |

| Transaction fees | Buyers or merchants later. | Only where Shoppage controls payment or protection. |

| Partner referrals | Payments, delivery, finance and services. | Transparent and non-exclusive where possible. |



| Offer | Indicative price | Included value |

| --- | --- | --- |

| Free Merchant | US$0 | Basic Shop, limited active products, WhatsApp/call, QR and limited analytics. |

| Starter | US$5-8/month | More products, offers, freshness tools, basic leads and clips. |

| Growth | US$15-20/month | Advanced leads, staff, creator tools, campaign credits and analytics. |

| Pro | US$35-60/month | Branches, bulk import, advanced reports, integrations and priority support. |

| Market | US$50-250/month | Market page, member administration, shared campaigns and analytics. |

| Onboarding | US$20-150 once-off | Catalogue, photography, video and setup depending on scope. |

| Managed ads | US$75-500+/month | Campaign strategy, content, optimisation and reporting, excluding spend. |

| Self-service ads | From US$2/day or US$20 campaign | Simple local product, video or lead promotion. |



| Scenario at month 6 | Operating assumptions | Monthly revenue range |

| --- | --- | --- |

| Conservative | 250 active vendors; 50 paying; limited ads; 5 markets. | US$4,000-8,000 |

| Base | 500 active vendors; 150 paying; repeat managed campaigns; 10-15 markets. | US$12,000-23,000 |

| Accelerated | 1,000 active vendors; 350 paying; brand campaigns; 25 markets. | US$28,000-50,000 |



| Delivery mode | 0-3 month cash range | Trade-off |

| --- | --- | --- |

| Lean founder-led | US$25,000-45,000 | Small senior team, strict scope, founder performs sales and product, limited field coverage. |

| Standard launch | US$50,000-90,000 | Balanced product team, field onboarding, moderation, content and launch campaigns. |

| Accelerated national pilot | US$100,000-180,000 | Parallel squads, larger merchant acquisition, more media production and institutional engagement. |



| Function | Minimum coverage | Critical responsibility |

| --- | --- | --- |

| Product / founder | 1 accountable lead | Scope, commercial decisions, partner alignment and weekly acceptance. |

| Engineering | 3-5 strong full-stack/backend engineers | Core platform, integrations, quality and security. |

| Design / research | 1 product designer | Mobile flows, field testing and design system. |

| QA / release | 1 shared or dedicated | Test automation, device matrix and launch readiness. |

| Merchant operations | 2-5 field/onboarding staff | Catalogue activation, training and quality. |

| Growth and ad sales | 1-2 | Merchant pipeline, campaigns and market partnerships. |

| Content / moderation | 1-2 | Video quality, creator briefs, safety and complaints. |

| Legal / compliance | Part-time specialist | Terms, privacy, consumer, advertising and contracts. |



| Recommended first cluster Home, Power and Building: solar, batteries, inverters, electrical, plumbing, hardware, building materials, appliances, furniture, installation and related services. This cluster supports high-intent search, comparison, quote requests, local availability, technical video and diaspora purchasing. |

| --- |



| Selection criterion | Why the wedge fits | Implication |

| --- | --- | --- |

| High purchase intent | Buyers actively search and compare. | Search and RFQ produce measurable value. |

| Local availability matters | Stock and location change the buying decision. | Geo and freshness are meaningful differentiators. |

| Higher ticket values | A few qualified leads can justify merchant spend. | Lead and managed campaign revenue are viable. |

| Video is useful | Demonstration and installation reduce uncertainty. | Showcase content adds conversion value. |

| Diaspora relevance | Remote buyers fund household and construction needs. | Verified fulfilment can become a strong niche. |

| Dense vendor clusters | Harare has identifiable supplier areas. | Markets and field acquisition can create liquidity quickly. |



| Entity class | Target count | Data captured |

| --- | --- | --- |

| Facebook-led informal and small sellers | 400 | Category, area, page/group activity, products, contact, trust and workflow. |

| Formal retailers and service businesses | 250 | Branches, systems, ad spend, catalogue size and decision maker. |

| Creators, group admins and media pages | 100 | Audience, category, geography, content capability and commercial terms. |

| Markets, malls and commercial clusters | 100 | Ownership, vendor count, location, category mix and administration. |

| Brands, distributors and wholesalers | 75 | Channel structure, campaign needs, data and reseller network. |

| Payments, logistics, finance and support partners | 50 | Coverage, integration, service level, pricing and regulation. |

| Institutions and associations | 25 | Mandate, beneficiaries, partnership case and governance. |



| Stage | Definition of done | Owner |

| --- | --- | --- |

| Qualified | Relevant category, location and decision maker identified. | Sales / field. |

| Verified | Phone and minimum identity/location evidence accepted. | Trust operations. |

| Catalogued | Minimum product threshold and required data complete. | Onboarding. |

| Fresh | Required share confirmed inside category window. | Merchant success. |

| Responsive | Test lead answered within agreed SLA. | Merchant success. |

| Activated | At least one real buyer action or campaign interaction. | Growth. |

| Retained | Active and fresh across consecutive review periods. | Account owner. |



| Trust level | Evidence | Displayed meaning |

| --- | --- | --- |

| Contact verified | Phone and email or OTP. | The contact channel is controlled by this account. |

| Identity verified | Government-issued identity or approved business representative. | Shoppage has verified the responsible person. |

| Location verified | Site visit, geotagged evidence or recognised market confirmation. | The stated trading location has been checked. |

| Business verified | Company or trading documents where applicable. | Business credentials have been reviewed. |

| Performance verified | Sustained response, accurate listings and low complaint rate. | Platform behaviour supports higher trust. |



| Capability | 0-3 months | 4-6 months |

| --- | --- | --- |

| Currency | USD and ZWG display, dated rates, price-valid-until and merchant confirmation. | More currencies for diaspora and improved rate governance. |

| Payment methods | Cash, collection, mobile money, bank, card/pay-link and deposit flags. | Integrated payment links, deposits and selected protected payments. |

| Checkout | Optional reservation or quote, no forced universal cart. | Single-vendor checkout for selected categories. |

| Delivery | Merchant delivery, pickup and partner quote request. | Integrated partner estimates, dispatch status and proof. |

| Buyer protection | Warnings, verified sellers, complaint path and evidence. | Limited escrow/protection pilot with regulated partner. |

| Settlement | Outside platform unless integrated partner handles payment. | Reconciliation and vendor payout only after controls are ready. |



| Use of AI in development | Required control | Reason |

| --- | --- | --- |

| Code generation | Human review, tests, linting and dependency checks. | Speed without hidden security and maintainability debt. |

| Schema and migrations | Architecture approval and rollback plan. | Data integrity is harder to repair than UI defects. |

| Test generation | Coverage review and realistic fixtures. | Generated tests can repeat the same mistaken assumption. |

| UI implementation | Design-system constraints and device QA. | Avoid inconsistent or inaccessible screens. |

| Security review | Automated scanning plus specialist review. | AI cannot certify compliance or threat resistance. |

| Production operations | No unrestricted model access to production secrets or data. | Protect users, vendors and infrastructure. |



| Layer | Recommended technology | Implementation decision |

| --- | --- | --- |

| Public and merchant web | Next.js App Router PWA, Tailwind and component system. | One responsive app with role-based surfaces during MVP. |

| Operations console | Refine Core or custom admin components. | Internal dense workflows, not the main merchant experience. |

| API and business rules | NestJS modular monolith. | Authoritative layer for permissions, ads, leads and billing. |

| Database and ORM | PostgreSQL / Supabase with Prisma. | Tenant-scoped relational source of truth. |

| Search | Meilisearch plus PostgreSQL fallbacks. | Products, vendors, markets, videos and geo facets. |

| Jobs | BullMQ and Redis. | Imports, indexing, media, reminders, analytics and AI. |

| Images and files | Supabase Storage or compatible object storage. | Organisation-scoped paths and policies. |

| Short video | Cloudflare Stream initially; Mux as alternative. | Direct upload, encoding, adaptive delivery and analytics. |

| Analytics | First-party event pipeline and product analytics. | Avoid dependence on a single external analytics vendor. |

| Hosting | Vercel plus container host; managed database and Redis. | Fast deployment with infrastructure as code. |



| Domain group | 0-3 month modules | Expansion modules |

| --- | --- | --- |

| Identity | Auth, users, organisations, roles, memberships and audit. | SSO, advanced delegation and institutional tenancy. |

| Merchant | Stores, branches, hours, policies, staff and verification. | Franchise and distributor hierarchies. |

| Catalogue | Categories, products, variants, media, price and freshness. | Supplier feeds, bundles and advanced compatibility. |

| Discovery | Search, geo, Showcase feed, saves and comparisons. | Advanced personalisation and visual search. |

| Demand | Leads, buyer requests, routing, notes and reminders. | Bookings, orders and transaction workflows. |

| Media | Clips, captions, tags, rights and moderation. | Live commerce and richer editing. |

| Advertising | Campaigns, budgets, placements, approvals and reports. | Agency accounts and advanced optimisation. |

| Creators | Profiles, links, briefs, commissions and disputes. | Automated payouts and creator marketplace depth. |

| Markets | Markets, captains, members, events and sponsorships. | Local-authority and market-management integrations. |

| Platform | Plans, billing, notifications, support and analytics. | Enterprise APIs and data products. |



| Metric group | Primary measures | Why it matters |

| --- | --- | --- |

| Supply quality | Active verified vendors, fresh products, catalogue completeness and branch accuracy. | Determines whether discovery can be trusted. |

| Demand | Searches, product opens, buyer requests, saves and return visits. | Shows real buyer utility. |

| Conversion | Search-to-contact, product-to-lead, RFQ fill and merchant response. | Connects activity to commerce. |

| Merchant value | Qualified leads, reported sales, repeat campaigns and retention. | Supports willingness to pay. |

| Creator value | Active creators, accepted content, attributed leads and payout accuracy. | Validates distribution network. |

| Ad value | Spend, cost per lead, campaign repeat and advertiser retention. | Tests local ad substitution. |

| Market value | Active market vendors, market demand and sponsorship revenue. | Tests market-in-market model. |

| Trust | Complaint rate, accuracy reports, resolution time and repeat buyers. | Protects the brand and adoption. |

| Operations | Activation cost, time to catalogue, moderation SLA and support load. | Determines scalability. |

| Economics | Revenue per active vendor, gross margin and cash burn. | Determines sustainability. |



| Outcome | Minimum target | Stretch target |

| --- | --- | --- |

| Verified active vendors | 100 | 200 |

| Fresh active products / services | 5,000 | 12,000 |

| Tagged short clips | 500 | 1,500 |

| Active markets / clusters | 5 | 10 |

| Active creators / agents | 30 | 75 |

| Median merchant response | Under 2 business hours | Under 30 minutes in trading hours |

| Visible listings confirmed in policy window | At least 80% | At least 90% |

| Buyer actions per week | 1,000 qualified actions | 3,000 qualified actions |

| Repeat advertisers | 10 | 25 |



| Period | Build and operating focus | Exit condition |

| --- | --- | --- |

| Weeks 0-1 | Company, legal, brand, architecture, design system, monorepo, environments, analytics taxonomy and pilot merchant list. | Approved scope, clickable flows, running skeleton and 30 committed pilot merchants. |

| Week 2 | Auth, organisations, roles, vendor onboarding, stores, branches, geo model and audit. | Merchant can create a secure organisation and branch. |

| Week 3 | Catalogue, products, media, price, currency, stock, freshness and assisted import. | Merchant can publish a complete structured product. |

| Week 4 | Showcase search, categories, product pages, store pages, nearby and sharing. | Buyer can discover and contact a relevant vendor. |

| Week 5 | Video upload, processing, tagging, feed, captions and moderation queue. | Buyer can watch a tagged clip and open the product. |

| Week 6 | Leads, WhatsApp/call attribution, buyer requests, routing and merchant inbox. | Demand can be captured, routed and managed. |

| Week 7 | Ads campaign setup, budgets, placements, sponsored labels, approvals and reports. | Merchant can run and measure a simple paid campaign. |

| Week 8 | Creator profiles, product links, briefs, attribution and manual payout ledger. | Creator can produce tagged content with auditable performance. |

| Week 9 | Markets, captains, membership, shared feed, map, events and QR. | One real market can operate end to end. |

| Week 10 | Trust levels, complaints, policies, consent, notifications, billing plans and support tools. | Commercial and safety controls ready for pilot. |

| Week 11 | Device QA, security review, load testing, data clean-up, merchant training and content seeding. | Launch candidate passes acceptance and incident drills. |

| Week 12 | Curated Harare launch, campaign execution, daily operations room and KPI review. | Public release with monitored supply, demand and support. |



| Workstream | Weeks 0-6 | Weeks 7-12 |

| --- | --- | --- |

| Merchant acquisition | Anchor merchants, market agreements and catalogue pilots. | Activation, freshness and case studies. |

| 1,000-entity register | Build taxonomy, collect and qualify first 600 entities. | Complete 1,000, deduplicate and prioritise pipeline. |

| Creators | Recruit 20 pilot creators and define briefs. | Publish campaigns, assess quality and attribution. |

| Ads sales | Interview advertisers and package managed offers. | Sell first repeatable campaigns and establish reporting. |

| Trust / compliance | Policies, verification design and legal review. | Operational moderation, complaints and audits. |

| Partnerships | Payments, video, logistics, markets and institutional meetings. | Pilot agreements and launch participation. |



| Expansion area | Month 4 | Months 5-6 |

| --- | --- | --- |

| Geography | Bulawayo supply activation and second-city market pages. | Selected corridors or cities based on partner density. |

| Categories | Phones/electronics or auto spares pilot after data model review. | Agriculture, fashion or services based on evidence. |

| Transactions | Reservations, deposits and payment links with partners. | Selected checkout and buyer-protection pilot. |

| Delivery | Partner directory, quotes and fulfilment status. | Integrated estimates, dispatch updates and proof. |

| Creators | More categories, creator marketplace and quality tiers. | Automated commission rules and payout integration. |

| Ads | Self-service improvements, saved audiences and brand dashboards. | Agency accounts, better optimisation and sponsorship products. |

| Markets | 10-25 active markets and standard onboarding kit. | Provincial and institutional market programmes. |

| AI | Better matching, moderation and merchant recommendations. | Personalisation and demand forecasting where data supports it. |

| Data products | Internal category dashboards. | Pilot aggregated reports for brands and distributors. |

| Institutional engagement | Demonstrate measured Harare outcomes. | National partnership and endorsement brief based on evidence. |



| Governance body | Mandate | Cadence |

| --- | --- | --- |

| Executive operating review | Product, growth, revenue, cash and major risks. | Weekly. |

| Trust and safety review | Complaints, fraud, prohibited content and appeals. | Weekly, urgent as needed. |

| Data and AI review | Privacy, model changes, data products and automated decisions. | Monthly. |

| Merchant council | Merchant pain, pricing, policies and roadmap feedback. | Monthly. |

| Creator council | Attribution, disclosure, rates and content standards. | Monthly. |

| Independent advisory board | National value, governance, partnerships and strategic risk. | Quarterly. |



| Risk | Failure mode | Mitigation |

| --- | --- | --- |

| Overbuilding | Team attempts a full TikTok, Google, Shopify and Amazon clone. | Version 1 completion tests and scope exclusions. |

| Empty marketplace | Public launch before dense, fresh supply exists. | Curated Harare wedge and anchor merchants. |

| Stale catalogue | Buyers encounter wrong prices and unavailable products. | Freshness engine, reminders, ranking decay and penalties. |

| Weak merchant response | Leads are ignored and buyers lose trust. | Response SLA, routing, alerts and performance visibility. |

| Low willingness to pay | Merchants do not value software alone. | Lead proof, ads, managed services and onboarding revenue. |

| Video cost / data burden | Feed becomes expensive or excludes low-data users. | Short clips, adaptive delivery, low-data mode and cost telemetry. |

| Fraud and scams | Platform reputation is damaged. | Progressive verification, limits, moderation and complaint operations. |

| Creator abuse | Fake leads, undisclosed ads and low-quality content. | Attribution rules, disclosure, review and payout windows. |

| Regulatory failure | Data, advertising or consumer obligations are missed. | Early legal review, policies, logs and designated compliance owner. |

| Political capture perception | Platform is seen as partisan or a surveillance tool. | Neutral governance, no political ads and privacy controls. |

| Platform dependency | External hosting, WhatsApp or payment changes disrupt operations. | Adapters, portability, graceful fallback and multi-partner strategy. |

| Cash burn | Field operations and media outpace revenue. | City/category focus, unit economics and milestone-based hiring. |



| Gate | Proceed condition | Action if missed |

| --- | --- | --- |

| Week 3 supply gate | At least 30 merchants can maintain structured catalogues. | Simplify onboarding and increase assisted service. |

| Week 6 demand gate | Real buyers use search/RFQ and merchants respond. | Refine wedge, routing and buyer acquisition before ads. |

| Week 8 ad gate | Merchants understand objectives and pay for test campaigns. | Emphasise managed campaigns and lead products. |

| Week 10 trust gate | Verification, complaint and moderation workflows work in drills. | Delay public scale; do not waive controls. |

| Month 3 retention gate | Merchants maintain freshness and repeat actions. | Reduce category breadth and strengthen success operations. |

| Month 4 city gate | Harare has stable supply and repeat demand. | Delay Bulawayo expansion. |

| Month 6 economics gate | Repeat revenue is growing and activation cost is controlled. | Restructure pricing, field model or category focus. |



| Final strategic instruction Build the commerce graph first. Make it fresh, local, trusted, measurable and useful before scaling. Use Facebook and WhatsApp as acquisition and distribution bridges, not permanent owners of the customer relationship. Sell merchants outcomes, not software features. Earn national endorsement through verified public value, not promises. |

| --- |



| Layer | Must have by week 12 | Not required for launch |

| --- | --- | --- |

| Central | Auth, organisations, stores, branches, catalogue, media, price, stock, freshness, leads, staff, analytics, billing. | Accounting, payroll, procurement and advanced ERP. |

| Showcase | Search, geo, feed, clips, product/store/market pages, saves, contact, RFQ and reports. | General social graph, messaging replacement and entertainment feed. |

| Ads | Campaign objective, product/video/store promotion, geo/category targeting, budget, review, placement and reporting. | External ad network, real-time bidding and complex lookalikes. |

| Creators | Profile, application, tagged links, briefs, disclosure, attribution, ledger and disputes. | Automated bank payouts and live commerce. |

| Markets | Market identity, boundary, admins, members, combined feed, search, map, QR, events, ads and analytics. | Lease, rent, security and full market management. |



| Domain | Core entities | Key relationships |

| --- | --- | --- |

| Identity | User, organisation, membership, role, verification, consent and audit event. | Users join organisations with scoped roles. |

| Merchant | Vendor, store, branch, location, hours, policy, payment method and delivery zone. | Vendor owns stores and branches. |

| Catalogue | Category, product, variant, attribute, media, price, inventory state and freshness event. | Products belong to vendor and may be available at branches. |

| Discovery | Search event, save, comparison, collection, recommendation and geo context. | Buyer actions connect demand to catalogue. |

| Media | Video, image, caption, tag, rights, moderation decision and view event. | Content tags products, stores, markets and campaigns. |

| Demand | Lead, buyer request, match, contact action, status, note and outcome. | Demand connects buyer context to vendors and creators. |

| Ads | Advertiser, campaign, objective, audience, creative, placement, budget, spend and result. | Campaign promotes commerce objects. |

| Creators | Creator profile, affiliate link, brief, commission, attribution, dispute and payout ledger. | Creator promotes approved commerce objects. |

| Markets | Market, boundary, member, captain, event, sponsorship and QR asset. | Markets aggregate vendors and content. |

| Platform | Plan, entitlement, invoice, credit, notification, support case and feature flag. | Commercial rules apply to organisations and users. |



| Event family | Examples | Required context |

| --- | --- | --- |

| Discovery | search_submitted, result_viewed, filter_applied, nearby_opened. | Query, category, coarse location and result set. |

| Content | video_impression, video_started, video_completed, product_tag_opened. | Video, creator, product, campaign and placement. |

| Commerce | product_viewed, saved, compared, WhatsApp_clicked, call_clicked. | Product, vendor, branch, source and sponsored state. |

| Demand | request_created, vendor_matched, lead_opened, lead_responded, outcome_reported. | Request, vendor, creator attribution and timing. |

| Ads | campaign_created, approved, impression, click, spend, conversion. | Advertiser, budget, placement and objective. |

| Trust | listing_reported, complaint_created, verification_changed, action_taken. | Actor, entity, evidence and resolution. |

| Merchant | product_created, price_changed, stock_confirmed, video_published. | Organisation, user, branch and timestamp. |



| Impact area | 100-day evidence | Six-month evidence |

| --- | --- | --- |

| MSME digitisation | Verified active merchants and fresh catalogues. | Retention, paid adoption and provincial reach. |

| Local ad retention | Campaign spend processed locally and first repeat advertisers. | Share of merchant digital budget moved to Shoppage. |

| Youth and creator income | Creators, agents and content fees paid. | Repeat earners and full-time equivalent jobs. |

| Consumer value | Search-to-lead, response and complaint resolution. | Repeat buyers, trust and reported fulfilment. |

| Markets and devolution | Active Harare market pages. | Multiple city and district market programmes. |

| Diaspora commerce | Verified leads and fulfilment pilots. | Repeat remote purchases and delivery evidence. |

| Local industry | Manufacturers and distributors listed. | B2B enquiries, reseller connections and demand insights. |

| Governance | Privacy, safety and audit controls operating. | Independent review and published transparency report. |



| Requirement | Implementation meaning | Proof standard |

| --- | --- | --- |

| 1. Difficult to recreate | Build proprietary verified data, workflows, relationships, response history and field operations. | A competitor can copy screens but cannot reproduce the underlying graph, trust and outcomes quickly. |

| 2. Intelligence beyond search | Record places, companies, branches, products, variants, availability, pricing, demand, relationships and operational constraints. | Answers must include live and local facts not reliably available through generic web results. |

| 3. International quality | Use global standards for speed, accessibility, safety, search, design, reliability and support. | Zimbabwe-specific design must improve relevance without lowering quality. |

| 4. Continuous improvement | Use modular architecture, event telemetry, feature flags, experiments and competitor reviews. | The release process must respond to evidence faster than competitors can respond to Shoppage. |

| 5. Practicality | Launch city by city and category by category, with assisted onboarding and measurable use cases. | No feature ships without an owner, operating process, adoption path and success metric. |

| 6. AI infused | Embed AI in ingestion, normalisation, search, assistance, risk, content, recommendations and operations. | AI reduces cost or improves decisions; it never becomes a decorative chatbot. |

| 7. Investor proof | Demonstrate recurring revenue, improving unit economics, proprietary assets, governance and expansion logic. | Capital must compound the moat rather than fund uncontrolled feature breadth. |

| 8. Local outperformance | Benchmark Facebook, Google, WhatsApp, Classifieds, Ownai, Shop@Zim and emerging platforms. | Shoppage wins on Zimbabwean commercial intent, structured data, trust, geo and outcomes. |

| 9. Daily relevance | Create legitimate daily reasons to return: alerts, deals, requests, market activity, price intelligence and saved needs. | Optimise for useful repeat behaviour, not compulsive dark patterns. |

| 10. National utility | Support formal and informal commerce, urban and provincial markets, diaspora demand and local value retention. | Public-value claims must be independently measurable. |



| Product doctrine Shoppage is not a website with listings. It is a continuously updated operating map of Zimbabwean commerce, connected to tools that improve the businesses and markets represented in that map. |

| --- |



| Moat | What Shoppage owns | Why it compounds |

| --- | --- | --- |

| Commerce graph moat | Resolved identities for businesses, places, products, variants, markets, creators and supply relationships. | Accumulated breadth, history, provenance and entity resolution. |

| Freshness moat | Price-validity, stock confirmations, response behaviour and customer corrections. | Operational routines and longitudinal history that static directories lack. |

| Demand moat | Searches, buyer requests, saves, shortages, comparisons and unfulfilled demand by location. | Exclusive first-party intent generated inside Shoppage. |

| Trust moat | Verification, complaints, response rates, fulfilment evidence and appeals. | Time-dependent reputation cannot be recreated from copied listings. |

| Workflow moat | Merchant catalogue, lead, campaign, creator and market management embedded in daily operations. | Switching costs created by useful work history, not artificial lock-in. |

| Distribution moat | Creators, market captains, field agents, associations, QR surfaces and merchant sharing. | Physical and social routes to market that software-only competitors cannot instantly acquire. |

| Outcome moat | Attributed calls, WhatsApp actions, RFQs, visits, reservations and verified fulfilment. | Proof that advertising and discovery generated economic activity. |

| Institutional moat | Relationships with markets, brands, councils, banks, telecoms, associations and development institutions. | Contractual and operational integration around public and commercial value. |

| Learning moat | AI models, rules and recommendations trained on local taxonomy, language and commerce outcomes. | Better local decisions as proprietary labelled data grows. |



| Milestone | Required evidence | Management decision |

| --- | --- | --- |

| Month 1 | Canonical data model, verification method, provenance rules and merchant workflow in production. | Do not add category breadth until data quality is stable. |

| Month 3 | Dense launch graph with fresh listings, demand events, response history, creator attribution and market relationships. | Scale only the categories where the graph improves buyer outcomes. |

| Month 6 | Repeat advertiser spend, repeat buyer use, proprietary demand reports and declining activation cost. | Raise expansion capital against demonstrated compounding assets. |

| Month 12 | Multi-city graph, institutional integrations and intelligence products with measurable retention. | Expand country or category footprint without weakening trust. |



| Graph domain | Examples | Required intelligence fields |

| --- | --- | --- |

| Places | Provinces, cities, suburbs, growth points, streets, landmarks, malls, markets, industrial clusters, pickup points and delivery corridors. | Boundaries, hierarchy, coordinates, aliases, access, hours and confidence. |

| Businesses | Formal companies, informal traders, market stalls, branches, service providers, distributors, manufacturers and associations. | Identity, category, contacts, locations, status, verification, relationships and history. |

| Products and variants | Canonical products, local names, brands, models, sizes, colours, grades, packs, conditions, compatibility and alternatives. | Attributes, evidence, media, offers, branch availability, currency and price validity. |

| Services | Installers, repairers, delivery operators, professionals, artisans and recurring service providers. | Service area, qualifications, capacity, pricing logic, response and outcomes. |

| Supply relationships | Manufacturer-distributor-retailer-reseller links, market membership, creator partnerships and delivery coverage. | Direction, evidence, effective dates, confidence and commercial restrictions. |

| Demand | Searches, requests, saves, comparisons, shortages, desired prices, intended location and urgency. | Anonymous/coarse by default; consented personal data only where required. |

| Behaviour | Views, responses, fulfilment reports, complaints, repeat visits, creator influence and campaign outcomes. | Event-level controls, retention rules and privacy-safe aggregates. |

| Improvement opportunities | Missing products, weak response, poor media, stale stock, pricing gaps, low trust and underserved areas. | Recommended action, expected value, owner and evidence. |



| Evidence class | Examples | Control |

| --- | --- | --- |

| First-party merchant | Catalogue entries, stock confirmations, branch details, delivery zones and policies. | Authenticated actor, audit history, reminders and random verification. |

| Field verified | Physical location, signage, stall position, operating hours and product sample. | Agent identity, timestamp, evidence media and supervisor spot check. |

| Customer contributed | Availability correction, proof of visit, review, complaint and fulfilled request. | Anti-abuse controls, evidence requirements and appeal. |

| Partner supplied | Distributor feed, payment status, market roster, logistics coverage and registry reference. | Contract, schema validation, refresh SLA and data-use terms. |

| Public-source extracted | Business pages, public posts, websites, catalogues and directories. | Respect terms and law; retain source URL/date; require confirmation for sensitive claims. |

| AI inferred | Entity match, category, attribute, compatibility, duplicate, demand forecast and risk flag. | Confidence score, evaluation set, explainability and human review threshold. |



| Dimension | Example rule | Platform consequence |

| --- | --- | --- |

| Completeness | Required category attributes, location, price logic, contact path and media present. | Lower-quality objects rank below complete alternatives. |

| Freshness | Confirmation window varies by product velocity and volatility. | Stale items decay, hide or require reconfirmation. |

| Provenance | Direct merchant or field evidence outranks weak public inference. | Confidence shown internally and in selected user labels. |

| Consistency | Price, stock and identity agree across branches and recent claims. | Conflicts trigger review rather than silent overwrite. |

| Trust | Verification and performance support the claim. | Advertising and lead access depend on trust tier. |

| Feedback | Reports and fulfilled outcomes validate or challenge data. | Quality score updates with abuse-resistant weighting. |



| User | Intelligence product | Commercial/public value |

| --- | --- | --- |

| Market manager | Footfall proxies, category gaps, tenant visibility, event performance and member responsiveness. | Improves the market as a destination and sells measurable sponsorship. |

| Distributor / brand | Demand heatmap, price bands, stock gaps, reseller activity, creator performance and campaign lift. | Improves allocation, sales activation and local advertising. |

| Financial partner | Consented merchant activity indicators, catalogue stability and demand evidence. | Supports better merchant services without claiming creditworthiness from unvalidated data. |

| Development institution | MSME digitisation, category participation, provincial coverage and capability gaps. | Targets programmes and measures outcomes. |

| Public authority | Aggregated market coverage, local-industry visibility and service gaps. | Supports planning while prohibiting individual surveillance or political profiling. |



| Intelligence boundary Shoppage should be comprehensive about commerce, not intrusive about citizens. It must not build political profiles, sell sensitive personal data, infer protected characteristics for advertising or make high-stakes eligibility decisions from opaque behavioural signals. |

| --- |



| Quality domain | Required standard | Evidence |

| --- | --- | --- |

| Performance | Fast first load on common mid-range Android devices; compressed media; low-data mode; resilient caching. | Track p50/p75/p95 load and interaction latency by network class. |

| Reliability | Graceful failure, retries, idempotent writes, backups, disaster recovery and operational alerts. | Define service objectives and publish internal incident reviews. |

| Search quality | Typo tolerance, synonyms, local names, structured facets, semantic matching and geo relevance. | Curated query set and weekly relevance evaluation. |

| Design quality | Consistent design system, clear hierarchy, one-handed mobile actions and high-quality merchant surfaces. | Design review and usability testing before release. |

| Accessibility | WCAG-aligned contrast, keyboard use, labels, captions, readable text and reduced motion. | Automated and manual accessibility checks. |

| Safety and trust | Visible sponsored labels, verification, reports, appeals, audit logs and prohibited-category controls. | Trust operations tested before growth campaigns. |

| Privacy and security | Least privilege, tenant isolation, encryption, consent, retention, deletion and incident response. | Security review, logs and privacy-impact assessment. |

| Support | Merchant onboarding, in-product help, WhatsApp support path, escalation and response targets. | Measure first response and issue resolution. |

| Content quality | Structured product data, rights management, captions, moderation and duplicate control. | Publishing score and enforcement rules. |

| Internationalisation | Currency, language, date, measurement, country and tax abstractions. | Zimbabwe configuration first; no hard-coded country assumptions. |



| Global capability | Shoppage adaptation | Competitive benefit |

| --- | --- | --- |

| Local inventory search | Branch-level availability, market/stall location, price validity and confirmation request. | More operationally useful for Zimbabwean buying conditions. |

| Shoppable short video | Every clip tied to structured products, location, stock and local action. | Entertainment reach becomes measurable local commerce. |

| Affiliate commerce | Lead, quote, visit and later sale attribution, not only card checkout. | Works before all transactions are digitally closed. |

| Business profiles and maps | Actual products, service areas, market membership and trust history. | Commercial map rather than static place directory. |

| Advertising manager | Fixed local packages, assisted campaigns, outcome reporting and creator activation. | Accessible to merchants who find global ad tools complex. |

| AI shopping assistant | Grounded in verified local graph with evidence and confidence. | Answers local availability and suitability, not generic web text. |



| Cadence | Activity | Output |

| --- | --- | --- |

| Weekly | Review local platforms, social-commerce behaviour, support tickets and lost deals. | Top five friction points and immediate fixes. |

| Monthly | Structured benchmark of Facebook, Google, TikTok, YouTube, marketplaces and African commerce platforms. | Capability gap matrix, adoption evidence and build/buy/ignore decision. |

| Quarterly | Merchant, creator, buyer and market councils review roadmap and pricing. | Validated priorities and policy changes. |

| Six-monthly | Architecture, data, security and product-quality review against expansion plan. | Investment plan and technical-debt budget. |



| AI layer | Primary use | Required control |

| --- | --- | --- |

| Ingestion AI | Extract products, variants, prices, contacts and locations from merchant photos, spreadsheets, PDFs, voice notes and public content. | Human confirmation before material claims publish. |

| Entity resolution | Match duplicate businesses, branches, products, brands and aliases. | Confidence threshold, merge review and reversible history. |

| Catalogue intelligence | Category, attributes, compatibility, alternatives, bundles, missing fields and quality scoring. | Category-specific evaluation sets. |

| Search and matching | Semantic retrieval, local synonyms, intent classification and RFQ-to-vendor matching. | Relevance tests and no silent exclusion of valid small vendors. |

| Content copilot | Descriptions, captions, price overlays, translation, thumbnails and campaign variants. | Rights, factuality and prohibited-claim checks. |

| Merchant copilot | Weekly actions for catalogue, pricing, stock, leads, campaigns and creator selection. | Recommendation evidence and merchant control. |

| Buyer assistant | Grounded answers, comparisons and action plans based on verified graph data. | Sources, freshness and uncertainty visible. |

| Trust AI | Duplicate images, suspicious prices, spam, prohibited goods, fake leads and abnormal behaviour. | Human appeal and bias/error monitoring. |

| Operations AI | Support triage, moderation queues, data-quality prioritisation and field-agent routes. | Audit logs and service-level monitoring. |

| Forecasting AI | Demand, stock gaps, campaign yield and market opportunities after sufficient data accumulates. | Backtesting and conservative use before automation. |



| Evaluation | Minimum test | Release gate |

| --- | --- | --- |

| Extraction | Representative Zimbabwean merchant images, posts, spreadsheets and voice transcripts. | Accuracy by required field and safe fallback. |

| Search | High-frequency, misspelled, local-name and location queries. | Relevance improvement without material trust degradation. |

| Matching | Buyer requests mapped to eligible vendors. | Coverage, precision, response and fairness across merchant size. |

| Moderation | Known scams, prohibited categories, legitimate edge cases and local language. | Acceptable false-positive/negative rates and appeal path. |

| Recommendations | Historical or controlled tests for merchant and buyer actions. | Measured outcome lift, not engagement alone. |

| Assistant | Grounded questions with stale, conflicting and missing evidence. | Correct uncertainty, evidence links and no fabricated facts. |



| Proof area | Month 3 threshold | Month 6 threshold |

| --- | --- | --- |

| Supply | Dense launch categories, verified merchants, fresh products and active market pages. | Second-city replication with controlled onboarding cost. |

| Demand | Repeat searches, requests, saves and merchant contact with good response. | Cohort retention and growing organic/direct traffic. |

| Revenue | Paid onboarding, managed campaigns, first subscriptions and repeat advertisers. | Predictable monthly revenue mix and improving gross margin. |

| Moat | Canonical graph, provenance, freshness, trust and creator attribution functioning. | Unique demand reports and measurable data-quality improvement. |

| Unit economics | Known merchant activation cost and lead/campaign delivery cost. | Improving payback, revenue per active merchant and support efficiency. |

| Governance | Policies, financial controls, data register, contracts and decision rights. | Board reporting, risk review and independent assurance plan. |

| Technology | Stable production system with observability, backups and release controls. | Capacity, security and multi-city scaling evidence. |



| Player | Strength to respect | Shoppage outclass position |

| --- | --- | --- |

| Facebook / Marketplace / groups | Mass reach, existing identities, social proof, informal sharing and seller familiarity. | Structured catalogues, canonical products, freshness, verified locations, local search, demand routing, merchant analytics and local ad-value capture. |

| WhatsApp / Status | Direct communication, trust through existing contacts and low learning barrier. | Persistent discovery, shared catalogues, lead structure, attribution, reminders and cross-vendor comparison while retaining WhatsApp hand-off. |

| Google Search / Maps / Shopping | Broad discovery, mapping, web index and mature advertising. | Deeper Zimbabwean product/variant/availability intelligence, market/stall mapping, local actions and informal-commerce coverage. |

| Classifieds.co.zw | Established categories, free-ad workflow, suburb selection and broad vertical coverage. | Persistent verified merchant nodes, branch inventory, short video, buyer requests, creator attribution, markets, intelligence and merchant operating tools. |

| Ownai | Broad retail categories, cart, comparison, seller access and adjacent services such as airtime, bills and tickets. | Open commerce graph across more merchant types, geolocal market discovery, content commerce, local ads, RFQ, creator and intelligence layers. |

| Shop@Zim | Local multi-vendor positioning, verified-supplier claim, quote flow, product categories and local/export orientation. | Greater buyer frequency, geo, videos, demand data, market networks, merchant workflows, creator distribution and measurable advertising. |

| Emerging local marketplaces | Local focus, category niches, entrepreneurial speed and potential communities. | Shared infrastructure depth, trust history, data quality, market density, APIs and institutional partnerships. |

| TikTok / YouTube Shorts | Highly engaging video, creator reach and content tools. | Commerce-only relevance, product/stock/location grounding, local lead attribution and Zimbabwe creator monetisation. |



| Competitive position Facebook knows who people know. Google knows what the public web says. Classifieds know what advertisers posted. Conventional marketplaces know what is listed for sale. Shoppage must know what Zimbabwean commerce can actually provide, where, in which variant, under which conditions, with what trust and in response to which unmet need. |

| --- |



| Rule | Implementation | Prohibited pattern |

| --- | --- | --- |

| User control | Granular notification topics, frequency and quiet times. | Forced alerts or difficult unsubscribe. |

| Finite value | Feeds can surface “you are up to date” and purposeful next actions. | Endless low-value autoplay designed only for time spent. |

| Transparent ranking | Explain sponsored, nearby, fresh and recommended signals. | Hidden pay-to-rank presented as neutral. |

| Outcome metrics | Optimise fulfilled needs, leads, saves and return utility. | Optimising emotional arousal or compulsive refresh. |

| Youth safety | Age-aware content and restricted categories. | Targeting minors with manipulative commercial pressure. |

| Privacy | Use consented first-party preferences and coarse location where possible. | Sensitive inference or cross-context surveillance. |



| In scope by week 12 | Deliberately constrained | Deferred |

| --- | --- | --- |

| Shoppage Central, Showcase, Ads, Creators and Markets complete their primary workflows. | Harare-first; Home, Power and Building; curated merchants and markets. | National breadth, general social network and broad entertainment. |

| Canonical business/place/product graph with provenance, freshness and verification. | Thousands of high-quality products rather than millions of scraped records. | Fully automated universal ingestion without confirmation. |

| Search, geo, short clips, RFQ, leads, creator attribution, campaigns and reporting. | Simple objectives and fixed ad packages alongside managed campaigns. | Complex auction, external ad network and advanced attribution. |

| AI ingestion, normalisation, grounded ask, matching, moderation assistance and merchant recommendations. | Human review for material claims and high-risk decisions. | Autonomous pricing, credit or enforcement decisions. |

| Operational support, complaints, audits, backups, metrics and field workflows. | Partner delivery/collection and payment links where suitable. | Owned national logistics, escrow and full multi-vendor settlement. |



| Period | Delivery definition |

| --- | --- |

| Weeks 0-1: decisions and controls | Freeze category/city scope; appoint product/engineering/operations owners; finalise data model, verification, policies, analytics events, brand and architecture; recruit anchor merchants and market partners. |

| Week 2: foundation | Deploy auth, organisations, roles, stores, branches, geo, catalogue, media, audit, feature flags, observability, backups and CI/CD; launch the field register and canonical ID rules. |

| Weeks 3-4: Central and graph | Mobile merchant onboarding; product/variant ingestion; price and stock; freshness; provenance; verification; rapid daily actions; assisted onboarding; first 30-50 active merchants. |

| Weeks 5-6: Showcase and demand | Search, facets, geo, product/store/market pages, low-data short clips, saves, WhatsApp/call/directions, buyer requests and vendor routing; buyer usability tests. |

| Weeks 7-8: Ads, creators and markets | Fixed promotion packages, campaign review, sponsored labels and reporting; creator profiles, tagged links and lead attribution; market rosters, combined feeds, QR assets and captain workflow. |

| Weeks 9-10: intelligence, trust and AI | Grounded Shoppage Ask beta; demand radar; quality scores; entity resolution; moderation queues; complaints/appeals; merchant action recommendations; load and security testing. |

| Weeks 11-12: controlled launch | Populate dense supply; run creator and market campaigns; test billing and support; validate response and freshness; launch to selected public cohorts; publish transparent metrics and issue log. |



| Function | Minimum accountable capacity | Critical responsibility |

| --- | --- | --- |

| Product / programme | 1 senior owner plus business founder decisions. | Scope, user value, roadmap and cross-team decisions. |

| Engineering | 1 senior full-stack/architect, 2-4 product engineers, part-time DevOps/security. | Reliable platform, data model, integrations and release controls. |

| Design / research | 1 strong product designer with field-testing capability. | International-quality mobile experience and usability. |

| Data / AI | 1 applied AI/data engineer or strong shared capability. | Ingestion, entity resolution, search, evaluation and intelligence. |

| Merchant operations | 1 lead plus 3-8 agents/captains depending target supply. | Onboarding, verification, freshness and support. |

| Trust / support | Named owner plus trained operational coverage. | Complaints, moderation, appeals and service response. |

| Commercial | Founder/commercial lead plus campaign operator. | Anchor merchants, markets, ads, creators and partners. |



| Gate | Minimum evidence | Consequence if missed |

| --- | --- | --- |

| Data quality | Target catalogue completeness, provenance and freshness achieved in launch categories. | Delay broad acquisition and fix onboarding/data operations. |

| Buyer utility | Search/RFQ users find relevant vendors and take meaningful actions. | Narrow taxonomy, improve ranking and increase supply density. |

| Merchant value | Merchants respond, update stock and recognise attributable leads. | Simplify daily workflow and strengthen success operations. |

| Ad value | At least several advertisers pay and can interpret outcomes. | Prioritise managed packages before self-service scale. |

| Trust | Verification, reports, complaints and appeals work in live drills. | Do not scale public promotion. |

| Reliability | Production monitoring, backup restore, security checks and support coverage pass. | Hold launch until defects are resolved. |



| Expansion stream | Months 4-5 | Month 6 proof |

| --- | --- | --- |

| Geography | Replicate playbook in Bulawayo or the strongest evidence-backed second cluster. | Comparable activation, freshness and buyer response at controlled cost. |

| Categories | Add one high-value category such as phones/electronics or auto spares after taxonomy review. | Compatibility, fraud and data-quality controls work. |

| Intelligence | Expand Price Pulse, Demand Radar, Market Lens and merchant copilot. | Users act on intelligence and selected reports support revenue. |

| Ads | Improve self-service, saved audiences, creator briefs and brand dashboards. | Repeat spend, better outcome yield and manageable support. |

| Creators | Introduce tiers, briefs marketplace, content quality and limited automated commissions. | Repeat creator earnings and fraud-controlled attribution. |

| Markets | Standardised captain kit, dashboards and sponsorship products. | 10-25 useful active market pages with maintained data. |

| Transactions | Reservations, deposits, payment links and proof of fulfilment in selected flows. | Disputes controlled and economics understood. |

| APIs | Pilot distributor, logistics, POS, market or financial-partner integration. | Reliable refresh SLA and mutual commercial value. |

| Governance | Board/advisory reporting, data review, transparency metrics and investor data room. | Investment readiness supported by evidence rather than narrative. |



| Scale rule No city, category or major feature expands merely because development is possible. Expansion requires a local supply owner, data-maintenance plan, trust controls, buyer-acquisition route, revenue hypothesis and measurable stop condition. |

| --- |



| Component | Required evidence | Independent check |

| --- | --- | --- |

| 100-day impact brief | Active merchants, fresh products, buyers, leads, campaign spend and jobs/earnings. | Auditable definitions and sample validation. |

| National demonstration | End-to-end merchant, buyer, creator and market workflows. | Live production data with privacy protection. |

| Governance file | Policies, company control, data map, legal review, audits and incident process. | External legal/security review. |

| Economic-value case | Local ad retention, merchant outcomes, creator payouts and local-industry visibility. | Financial records and methodology. |

| Inclusion case | Informal/formal mix, women/youth participation, provincial plan and low-data access. | Disaggregated but privacy-safe metrics. |



| Unit | Mandate | Primary output |

| --- | --- | --- |

| Product and engineering | Build reliable shared platform and user workflows. | Frequent, safe product improvements. |

| Commerce graph and AI | Taxonomy, entity resolution, data quality, search, models and intelligence. | Trusted proprietary graph and recommendations. |

| Merchant success and field network | Onboarding, verification, freshness and workflow adoption. | Active high-quality supply. |

| Demand and growth | Buyer acquisition, lifecycle, referrals, content distribution and market activation. | Repeat qualified demand. |

| Ads and commercial | Campaigns, plans, creators, markets, brands and partners. | Repeat revenue and attributable outcomes. |

| Trust, support and compliance | Moderation, complaints, appeals, privacy, security and policies. | Safe, legitimate platform operation. |

| Finance and governance | Cash, controls, contracts, reporting, board and investor readiness. | Capital discipline and accountability. |



| Cadence | Meeting / artefact | Decision |

| --- | --- | --- |

| Daily | Launch operations dashboard and incident/quality queue. | Freshness, support, trust and campaign intervention. |

| Weekly | Product-commercial-operating review. | Priorities, experiments, merchant/demand issues and cash. |

| Fortnightly | Release review and architecture/data-quality gate. | Ship, hold, roll back or retire features. |

| Monthly | Unit economics, cohort, competitor and risk review. | Resource allocation and roadmap changes. |

| Quarterly | Board/advisory and public-value review. | Strategy, governance, funding and expansion. |



| Dimension | Core measures | Question answered |

| --- | --- | --- |

| Graph depth | Verified active businesses/places; canonical products/variants; coverage by category/area; provenance strength. | Is the asset difficult to reproduce? |

| Freshness and truth | Share confirmed within policy; correction rate; price validity; stock-confirmation response. | Can users trust operational facts? |

| Buyer utility | Successful search rate; search-to-action; RFQ match and response; repeat use; fulfilled need reports. | Does Shoppage save time or money? |

| Merchant utility | Weekly active merchants; stock/price actions; lead response; retained cohorts; revenue lift evidence. | Is Shoppage embedded in operations? |

| Daily habit | Useful returning users; alert action; saved-need resolution; market/category repeat. | Is frequency based on value? |

| Ads | Repeat advertisers; spend; outcome rate; cost per qualified action; merchant interpretation of reports. | Can local advertising compete for budget? |

| Creators | Active quality creators; attributed actions; repeat earnings; fraud/dispute rate. | Does distribution compound? |

| Markets | Active markets, maintained vendors, QR traffic, events, sponsor revenue and market-level demand. | Does market-in-market work? |

| Economics | MRR, revenue mix, gross margin, activation cost, payback, revenue per active merchant and burn. | Is growth financeable? |

| Quality | Performance, uptime, error, support, accessibility, security and incident metrics. | Does execution meet international standards? |

| AI | Cost per task, accuracy, human correction, outcome lift and failure/appeal rates. | Is AI operationally valuable and safe? |

| National value | MSME digitisation, local campaign value, creator/agent earnings, local products and geographic reach. | Is endorsement supported by evidence? |



| Recommended north star Verified Commerce Outcomes: the number of buyer needs that reach a qualified, responsive merchant and result in a confirmed useful outcome - contact, quote, reservation, visit, collection, delivery or purchase - with attribution and trust controls. This combines demand, supply quality and practical value better than traffic alone. |

| --- |



| Board-level instruction Approve no initiative that does not strengthen verified commerce utility, proprietary intelligence, trusted outcomes, revenue quality or scalable operating capability. Competitors may copy appearance. Shoppage must make the underlying Zimbabwean commerce system too deep, fresh, connected and useful to copy overnight. |

| --- |



| Domain | Minimum entities | Critical claim types |

| --- | --- | --- |

| Geography | Country, province, district, city, suburb, growth point, route, landmark, market, building, stall, geo zone. | Located at, contains, serves, delivers to, open at, access condition. |

| Organisation | Legal entity, trading name, informal seller, association, brand, distributor, manufacturer, market operator. | Owns, operates, distributes, manufactures, member of, verified as. |

| Commerce location | Store, branch, stall, warehouse, pickup point, service base. | Located at, hours, payment accepted, collection, delivery, accessibility. |

| Catalogue | Category, product family, product, variant, attribute, brand, model, bundle, alternative. | Has attribute, compatible with, substitute for, sold by, available at. |

| Offer | Price, currency, validity, promotion, minimum order, stock state, lead time and terms. | Price claimed, confirmed, expired, available, made to order. |

| Content | Image, video, document, caption, collection, creator post and rights record. | Depicts, promotes, explains, sponsored by, authorised by. |

| Demand | Search, saved need, request, quote, comparison, shortage and urgency. | Wants, located near, budget, deadline, matched to, unresolved. |

| Trust | Verification, evidence, complaint, review, correction, response, fulfilment and appeal. | Verified scope, reported, resolved, responded, fulfilled. |

| Commercial | Lead, campaign, placement, attribution, creator agreement, commission and invoice. | Generated by, sponsored, attributed to, payable, disputed. |

| Improvement | Gap, recommendation, task, benchmark and measured result. | Needs improvement, expected impact, accepted, completed, outcome. |



| Gate | Required artefact | Owner decision |

| --- | --- | --- |

| Use-case approval | Problem, user, benefit, risk, non-AI fallback and cost ceiling. | Build, buy, test or reject. |

| Data approval | Source rights, consent, sensitive-data review, representation and retention. | Data permitted, restricted or prohibited. |

| Offline evaluation | Gold dataset, baseline, error analysis and category/location breakdown. | Ready for limited pilot or revise. |

| Human workflow | Review threshold, override, audit and appeal. | Operationally safe or blocked. |

| Pilot | Feature flag, cohort, monitoring, user disclosure and rollback. | Expand, hold or stop. |

| Production monitoring | Accuracy proxy, correction, complaints, cost, latency and drift. | Continue, retrain, narrow or retire. |



| Register object | Minimum sample | Purpose |

| --- | --- | --- |

| Businesses and sellers | Formal retailers, informal traders, manufacturers, distributors, service providers and social sellers. | Test identity, onboarding, verification and category coverage. |

| Places and markets | Malls, CBD clusters, flea markets, industrial areas, growth points and pickup locations. | Test geographies, boundaries, access and market-in-market models. |

| Products and variants | High-demand items across launch categories, with aliases and compatibility. | Test taxonomy, search, price, availability and substitution. |

| Facebook and social commerce pages | Merchant pages, groups, creator pages and community administrators. | Understand existing distribution, content, trust and lead behaviour. |

| Customer needs | Search queries, RFQs, failed searches, saved needs and interviews. | Build real demand language and priority gaps. |

| Payments, logistics and enabling partners | Gateways, banks, mobile money, couriers, runners, collection points and POS providers. | Map practical conversion and fulfilment options. |

| Competitor and adjacent platforms | Marketplaces, directories, media pages, agencies, classifieds and commerce tools. | Maintain grounded benchmark and partnership/competition map. |



| Stage | Agent action | Quality control |

| --- | --- | --- |

| Discovery | Identify business/place, category, owner contact and public evidence. | Duplicate check before new ID. |

| Consent and explanation | Explain Shoppage, data use, public fields, verification and merchant control. | Standard script and consent record. |

| Identity and location | Capture trading name, business status, branch/stall, landmark and hours. | Evidence photo/document where appropriate; location confidence. |

| Catalogue sample | Capture priority products, variants, price logic, stock state and media. | Category template and merchant confirmation. |

| Conversion setup | Verify WhatsApp/call, collection, delivery and payment options. | Test contact path and record limits. |

| Training | Show daily stock, price, lead and clip actions. | Activation checklist completed by merchant. |

| Follow-up | Review first leads, freshness and missing fields within seven days. | Supervisor dashboard and dormant-account intervention. |



| Layer | Primary job and moat contribution | Week-12 completion test |

| --- | --- | --- |

| Shoppage Central | Turns merchants into structured, verified and active commerce nodes; owns workflow, catalogue, freshness, leads and history. | A merchant can onboard, publish, confirm, respond, promote and understand outcomes from a mobile device. |

| Shoppage Showcase | Resolves buyer needs through search, geo, short video, pages, saves and requests; produces demand data. | A buyer can find or request a relevant item, judge confidence and reach a qualified vendor without forced registration. |

| Shoppage Ads | Converts local commercial intent into measurable paid reach; produces advertiser history and outcome data. | A merchant can buy a transparent campaign and see spend plus qualified actions. |

| Shoppage Creators | Turns local content and influence into attributed commerce; builds distribution and creator earnings. | A creator can select approved products, publish/tag content and track valid outcomes. |

| Shoppage Markets | Digitises commercial clusters; builds place density, shared discovery and sponsorship inventory. | A market can manage identity, members, map, feed, QR traffic, events and campaigns. |



| Revenue engine | Economic character | Management objective |

| --- | --- | --- |

| Merchant plans | Recurring software/service revenue with support and media usage. | Increase retained active merchants and gross margin through standardisation. |

| Managed onboarding and content | Service revenue that accelerates supply and cash. | Productise packages, train agents and reduce hours per activated merchant. |

| Shoppage Ads | Usage revenue with media, moderation, sales and support costs. | Drive repeat spend and measurable outcomes; automate only after fit. |

| Creator campaigns | Campaign/service margin plus optional platform fee or commission. | Increase valid outcome volume while controlling fraud and disputes. |

| Market subscriptions/sponsorship | Recurring B2B/community revenue with field operations. | Standardise market kit and create shared sponsor inventory. |

| Qualified leads/RFQs | Outcome-linked revenue where buyer and vendor value is high. | Define valid lead, cap disputes and avoid double charging. |

| Intelligence products | High-margin aggregate insights and decision tools. | Earn trust through methodology, coverage and privacy safeguards. |

| Transaction services later | Commission, convenience, protection or fulfilment fee. | Add only where Shoppage materially improves conversion or risk. |



| Scenario | Core assumption | Required response |

| --- | --- | --- |

| Conservative | Slow merchant payment, managed services dominate and buyer growth is gradual. | Protect runway, narrow categories, prioritise outcomes and standardise service delivery. |

| Base | Strong anchor supply, repeat ads emerge, subscriptions grow after demonstrated leads. | Invest in second-city replication, creator/market systems and data quality. |

| Ambitious | High organic demand, brands/markets adopt, creator distribution works and intelligence is valued. | Scale infrastructure and leadership without relaxing trust or scope gates. |



| Subcategory | Key structured intelligence | Primary conversion |

| --- | --- | --- |

| Solar and backup power | System size, inverter rating/type, battery chemistry/capacity, panels, warranty, installation, compatibility and lead time. | Advice/RFQ, store visit, installation quote and reservation. |

| Electrical and plumbing | Brand/model, specifications, dimensions, standards, compatibility, pack and installation availability. | Search, comparison, quote and collection. |

| Hardware and tools | Tool type, power, size, grade, consumables, rental/sale, warranty and branch stock. | Immediate availability and price-led contact. |

| Building materials | Grade, dimensions, quantity, minimum order, delivery zone, transport cost logic and price validity. | Bulk RFQ, delivery quote and supplier comparison. |

| Furniture and appliances | Dimensions, material, colour, condition, energy/power, warranty, made-to-order and delivery. | Video discovery, reservation, store visit and delivery request. |

| Installation and services | Service area, qualification, capability, evidence, pricing basis, availability and workmanship policy. | Quote and booking request. |



| Control domain | Implementation | Evidence |

| --- | --- | --- |

| Tenant and role security | Organisation-scoped records, least privilege, branch roles, admin separation and row-level defence. | Automated access tests, audit logs and periodic review. |

| Data inventory | Register personal, merchant, public, partner, derived and sensitive data with purpose and retention. | Data map, owners and privacy-impact assessments. |

| Consent and notices | Layered notices for public profiles, leads, location, messaging, creator attribution and analytics. | Versioned consent and withdrawal records. |

| Security engineering | Encryption, secrets management, secure coding, dependency scanning, backups and incident response. | Test results, restore drills and incident register. |

| AI governance | Prompt/model register, source rights, evaluation, human review, appeal and provider data terms. | Model cards and release approvals. |

| IP and contracts | Trademark, code ownership, employee/contractor assignments, data licences and creator/media rights. | Executed agreements and asset register. |

| Merchant fairness | Published verification, ranking, advertising, suspension and appeal rules. | Decision logs and policy reports. |

| Consumer protection | Accurate claims, sponsored labels, pricing clarity, contact identity, complaints and prohibited goods. | Monitoring, resolution targets and enforcement history. |

| Partner access | Scoped APIs, contracts, rate limits, purpose restriction and termination. | Access logs and periodic partner audit. |



| Service | Initial target principle | Escalation |

| --- | --- | --- |

| Merchant onboarding | Self-service within minutes; assisted activation scheduled promptly; first useful catalogue within agreed package. | Merchant success owner for blocked activation. |

| Stock/price confirmation | Immediate update; search reflects change within a short operational window. | Queue alert and manual reindex path. |

| Buyer request routing | Eligible vendors notified quickly; buyer sees match and response status. | Reroute, expand radius or identify unresolved demand. |

| Merchant response | Category-specific target displayed and measured. | Reminder, ranking effect and success intervention. |

| Complaint acknowledgement | Prompt acknowledgement with severity triage. | Trust owner and urgent safety escalation. |

| Ad review | Low-risk trusted campaigns fast; high-risk claims manually reviewed. | Campaign hold with reason and appeal. |

| Critical incident | Detection, containment, communication and recovery roles pre-assigned. | Executive incident command and post-incident review. |

| Data correction | Simple corrections rapid; disputed identity or ownership evidence-based. | Case management and appeal. |

| Support | Published response windows by plan and severity. | Escalation path and customer-visible status. |



| Final operating reality Shoppage will not become defensible through AI-generated code alone. The moat is produced by disciplined acquisition, verified data, category expertise, merchant workflow adoption, customer outcomes, trust operations, creator and market distribution, and continuous product execution. AI accelerates each system; it does not replace them. |

| --- |



| Commitment | Operating interpretation | Board proof |

| --- | --- | --- |

| 1. Graph before breadth | Build canonical, versioned and evidence-backed commerce entities before opening unlimited listing categories. Every new category must enrich the graph rather than create unstructured volume. | Coverage quality, not raw listings. |

| 2. Freshness before traffic | Do not buy large consumer traffic for catalogue areas that cannot confirm price, stock, location and response. Failed discovery destroys trust faster than advertising can rebuild it. | Freshness and successful-search gates. |

| 3. Outcomes before impressions | Merchant reports and internal growth decisions must prioritise qualified actions and fulfilled needs. Impressions and video views are diagnostic, not the commercial promise. | Verified commerce outcomes. |

| 4. Mobile simplicity before dashboard density | The normal merchant should complete frequent actions on a phone with minimal taps. Complex enterprise controls may exist, but they cannot define the default experience. | Task completion and activation time. |

| 5. Local depth before national claims | Launch where Shoppage can be genuinely useful. Public language must distinguish active verified coverage from aspirational or discovered records. | Coverage map with confidence. |

| 6. Trust before scale | Verification, reporting, appeals, moderation and audit processes must operate before aggressive acquisition. Trust and safety staffing is part of launch cost. | Complaint and resolution performance. |

| 7. AI grounded in evidence | AI may draft, match and recommend, but cannot invent availability, identity, price or verification. User-facing intelligence must show freshness and uncertainty. | Grounding and correction rate. |

| 8. Human accountability | Every automated system has a named owner, review threshold, fallback and rollback. “The model decided” is not an acceptable operational explanation. | Model register and decision logs. |

| 9. Open distribution, owned intelligence | Use Facebook, WhatsApp, search engines, QR codes and partners to acquire and distribute. Preserve Shoppage as the system of record for catalogue, attribution, trust and intelligence. | Direct/organic return and graph growth. |

| 10. Merchant value before subscription pressure | Prove leads, visibility, organisation or intelligence before forcing payment. Monetisation should scale with visible business value and category economics. | Value-to-payment conversion. |

| 11. Local advertising as a product, not a slogan | Shoppage Ads must offer easier local targeting, clearer reporting and credible outcomes. Local ownership alone will not make advertisers switch. | Repeat advertiser spend. |

| 12. Creator quality before follower size | Reward content relevance, disclosure, valid actions and merchant outcomes. Large followings without commercial trust must not dominate allocation. | Valid-action and dispute metrics. |

| 13. Market operators as partners | Markets require accountable local maintenance, not one-time mapping. Market captains and operators need tools, incentives and standards. | Maintained market density. |

| 14. Data rights and privacy by design | Collect only what supports defined commerce purposes, protect sensitive data and preserve user rights. National intelligence must use privacy-safe aggregation. | Data inventory and impact reviews. |

| 15. International engineering discipline | AI-assisted speed cannot bypass typed contracts, tests, migrations, security, observability, backups and incident response. | Release and reliability controls. |

| 16. Modular improvement | New competitors and technologies should be matched through replaceable providers, feature flags and stable domain boundaries rather than emergency rewrites. | Release lead time and rollback. |

| 17. Capital discipline | Do not own fleets, inventory or broad transaction risk before demand proves the need. Spend should deepen supply, demand, trust, intelligence and revenue. | Runway and unit economics. |

| 18. Neutral national platform | No political capture, surveillance access or hidden ranking privilege. Endorsement must follow measured public value and transparent governance. | Policy, disclosure and access logs. |

| 19. Evidence-based expansion | Every new city, category and country requires supply ownership, buyer demand, trust coverage, operating capacity and a stop condition. | Expansion readiness score. |

| 20. Compounding advantage | At each quarterly review, management must show how new users, data, partnerships and revenue made Shoppage harder to replace and more useful than the previous quarter. | Moat scorecard and investor proof. |


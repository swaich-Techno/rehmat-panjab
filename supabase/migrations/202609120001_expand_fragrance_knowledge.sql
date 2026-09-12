-- Expand the approved, public fragrance glossary without changing product facts.
with knowledge(topic,aliases,explanation,source_title,source_url) as (values
('Accord',array['fragrance accord'],'An accord is a group of materials blended to create a unified impression that may resemble a flower, food, place or abstract idea.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('Fragrance development',array['evaporation','scent development'],'A fragrance changes over time because materials evaporate and become perceptible at different rates; the note pyramid is a useful description of that experience, not a literal set of sealed layers.','Note (perfumery)','https://en.wikipedia.org/wiki/Note_(perfumery)'),
('Projection',array['projects','radiates'],'Projection describes how far a scent seems to radiate from the wearer. It varies with dose, formula, skin, fabric, temperature and airflow.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('Sillage',array['scent trail'],'Sillage is the scented trail perceived around or behind a wearer; it is distinct from how long the fragrance remains detectable close to skin.','Sillage','https://en.wikipedia.org/wiki/Sillage_(perfume)'),
('Longevity',array['lasting power','how long'],'Fragrance longevity varies with composition, application amount, skin, fabric, climate and storage, so exact wear-time guarantees are unreliable.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('Citrus',array['hesperidic','bergamot','lemon'],'Citrus materials often give a bright, sparkling opening. Bergamot is especially common in fresh, floral, woody and amber structures.','Fragrance wheel','https://en.wikipedia.org/wiki/Fragrance_wheel'),
('Aromatic',array['herbal','lavender'],'Aromatic profiles emphasize herbs and fresh plant-like impressions such as lavender, rosemary or sage, often alongside citrus or woods.','Fragrance wheel','https://en.wikipedia.org/wiki/Fragrance_wheel'),
('Green',array['leafy','galbanum'],'Green profiles suggest crushed leaves, stems, grass or crisp plant sap and can make floral, woody or fruity compositions feel sharper and airier.','Fragrance wheel','https://en.wikipedia.org/wiki/Fragrance_wheel'),
('Chypre',array['oakmoss structure'],'Chypre is a classical fragrance structure commonly associated with a citrus opening over darker mossy, woody or resinous facets. Modern interpretations vary widely.','Chypre','https://en.wikipedia.org/wiki/Chypre'),
('Fougere',array['fougère','fern accord'],'Fougère is an aromatic structure traditionally associated with lavender, coumarin-like softness and mossy or woody depth; the name means fern, though it is an imaginative accord.','Fougère','https://en.wikipedia.org/wiki/Foug%C3%A8re'),
('Rose',array['rose note'],'Rose can smell fresh, dewy, green, honeyed, spicy, jammy or dark depending on the material and surrounding accords.','Rose oil','https://en.wikipedia.org/wiki/Rose_oil'),
('Jasmine',array['jasmine note'],'Jasmine materials can bring luminous floral sweetness, green freshness or richer indolic depth and are frequently used to give floral compositions volume.','Jasmine','https://en.wikipedia.org/wiki/Jasmine'),
('Sandalwood',array['sandalwood note'],'Sandalwood is valued for a smooth woody profile that may feel creamy, warm and softly persistent, although natural and reconstructed materials differ.','Sandalwood','https://en.wikipedia.org/wiki/Sandalwood'),
('Vetiver',array['vetiver note'],'Vetiver is an aromatic grass whose roots are used in perfumery, often giving dry, earthy, smoky, green or woody impressions.','Chrysopogon zizanioides','https://en.wikipedia.org/wiki/Chrysopogon_zizanioides'),
('Patchouli',array['patchouli note'],'Patchouli can smell earthy, woody, camphoraceous, chocolate-like or polished depending on quality, treatment and dosage.','Patchouli','https://en.wikipedia.org/wiki/Patchouli'),
('Incense',array['frankincense','olibanum'],'Incense effects may feel resinous, smoky, mineral, citrus-like or balsamic. Frankincense is one important resin used in incense and perfumery.','Frankincense','https://en.wikipedia.org/wiki/Frankincense'),
('Layering by bridge',array['bridge note','shared note'],'A restrained layering method pairs fragrances through a shared note or family, such as musk, rose, vanilla or wood, so the transition feels coherent. Start with one light application of each.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('Layering by contrast',array['contrast layering'],'Contrast layering pairs different profiles, such as bright citrus with warm woods or dry spice with soft vanilla. Test lightly because strength and sweetness can build quickly.','Perfume','https://en.wikipedia.org/wiki/Perfume'),
('South Asian attar tradition',array['indian attar','ittar tradition'],'Attar traditions in South Asia include concentrated aromatic preparations associated with flowers, herbs, spices and woods. Methods and meanings vary by maker, region and period.','Ittar','https://en.wikipedia.org/wiki/Ittar'),
('Middle Eastern fragrance tradition',array['arabian perfumery','bukhoor'],'Across Middle Eastern fragrance traditions, oils, resins, woods, rose, musk-style accords and incense may be worn or used in the home. Practices vary across communities and regions.','Arabian perfume','https://en.wikipedia.org/wiki/Arabian_perfume')
)
insert into public.fragrance_knowledge(topic,aliases,explanation,source_title,source_url,source_license,last_reviewed,approval_status,active,version)
select topic,aliases,explanation,source_title,source_url,'CC BY-SA 4.0','2026-09-12','approved',true,1 from knowledge
on conflict(topic,version) do update set aliases=excluded.aliases,explanation=excluded.explanation,source_title=excluded.source_title,source_url=excluded.source_url,source_license=excluded.source_license,last_reviewed=excluded.last_reviewed,approval_status='approved',active=true,updated_at=now();

update public.experience_settings set
  guide_provider='groq',guide_model='openai/gpt-oss-20b',guide_deterministic_fallback=true,
  guide_emergency_disable=false,guide_timeout_ms=6000,guide_max_tokens=420,guide_daily_limit=100,
  updated_at=now()
where id=true;

-- Public brand rename only; technical guide_* columns remain stable for compatibility.
update public.experience_settings
set guide_greeting = replace(guide_greeting, 'Rehmat Guide', 'Rehmat AI'), updated_at = now()
where id = true and guide_greeting like '%Rehmat Guide%';

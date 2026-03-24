BEGIN;

-- ============================================================
-- CRÉATION TABLE metrics (si elle n'existe pas)
-- Table de configuration des métriques par domaine
-- ============================================================

CREATE TABLE IF NOT EXISTS metrics (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id        uuid REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  metric_key       text NOT NULL,
  label            text NOT NULL,
  unit             text NOT NULL,
  icon             text NOT NULL,
  target_value     numeric,
  higher_is_better boolean NOT NULL DEFAULT true,
  UNIQUE (domain_id, metric_key)
);

ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous les utilisateurs connectés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'metrics' AND policyname = 'Metrics lisibles par tous'
  ) THEN
    EXECUTE 'CREATE POLICY "Metrics lisibles par tous" ON metrics FOR SELECT USING (true)';
  END IF;
END
$$;

-- ============================================================
-- MISE À JOUR table challenges : ajout colonnes manquantes
-- ============================================================

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS science_text  text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS insight_text  text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS metric_key    text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS metric_label  text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS metric_sub    text;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_measure    boolean NOT NULL DEFAULT false;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT true;

-- Contrainte unique pour le upsert (domain_id + level + ordre)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'challenges_domain_level_order_unique'
  ) THEN
    ALTER TABLE challenges
      ADD CONSTRAINT challenges_domain_level_order_unique
      UNIQUE (domain_id, level_index, order_index);
  END IF;
END
$$;

-- ============================================================
-- MÉTRIQUES
-- ============================================================

-- DOMAINE: sante
INSERT INTO metrics (domain_id, metric_key, label, unit, icon, target_value, higher_is_better)
VALUES
  ((SELECT id FROM domains WHERE slug = 'sante'), 'pas', 'Pas / jour', 'pas', '👟', 8000, true),
  ((SELECT id FROM domains WHERE slug = 'sante'), 'seances', 'Séances sport', '/semaine', '🏋️', 3, true),
  ((SELECT id FROM domains WHERE slug = 'sante'), 'repas', 'Repas équilibrés', '/semaine', '🥗', 10, true),
  ((SELECT id FROM domains WHERE slug = 'sante'), 'hydra', 'Hydratation', 'L/jour', '💧', 1.5, true),
  ((SELECT id FROM domains WHERE slug = 'sante'), 'masse', 'Masse grasse', '%', '⚖️', 15, false)
ON CONFLICT (domain_id, metric_key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, icon = EXCLUDED.icon,
  target_value = EXCLUDED.target_value, higher_is_better = EXCLUDED.higher_is_better;

-- DOMAINE: finances
INSERT INTO metrics (domain_id, metric_key, label, unit, icon, target_value, higher_is_better)
VALUES
  ((SELECT id FROM domains WHERE slug = 'finances'), 'epargne_taux', 'Taux d''épargne', '%', '💰', 20, true),
  ((SELECT id FROM domains WHERE slug = 'finances'), 'patrimoine', 'Patrimoine net', '€', '🏛️', NULL, true),
  ((SELECT id FROM domains WHERE slug = 'finances'), 'precaution', 'Épargne de précaution', 'mois', '🛡️', 6, true),
  ((SELECT id FROM domains WHERE slug = 'finances'), 'investi', 'Montant investi', '€/mois', '📈', 200, true),
  ((SELECT id FROM domains WHERE slug = 'finances'), 'revenus_passifs', 'Revenus passifs', '€/mois', '🌱', 500, true)
ON CONFLICT (domain_id, metric_key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, icon = EXCLUDED.icon,
  target_value = EXCLUDED.target_value, higher_is_better = EXCLUDED.higher_is_better;

-- DOMAINE: travail
INSERT INTO metrics (domain_id, metric_key, label, unit, icon, target_value, higher_is_better)
VALUES
  ((SELECT id FROM domains WHERE slug = 'travail'), 'energie_pro', 'Énergie pro', '/10', '⚡', 7.5, true),
  ((SELECT id FROM domains WHERE slug = 'travail'), 'ratio_choisi', 'Tâches choisies', '%', '🎯', 60, true),
  ((SELECT id FROM domains WHERE slug = 'travail'), 'competences', 'Compétences actives', '/trimestre', '🧠', 3, true),
  ((SELECT id FROM domains WHERE slug = 'travail'), 'stress_pro', 'Stress pro', '/10', '🌡️', 3, false),
  ((SELECT id FROM domains WHERE slug = 'travail'), 'revenu_pro', 'Revenu mensuel', '€/mois', '💰', NULL, true)
ON CONFLICT (domain_id, metric_key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, icon = EXCLUDED.icon,
  target_value = EXCLUDED.target_value, higher_is_better = EXCLUDED.higher_is_better;

-- DOMAINE: entrepreneuriat
INSERT INTO metrics (domain_id, metric_key, label, unit, icon, target_value, higher_is_better)
VALUES
  ((SELECT id FROM domains WHERE slug = 'entrepreneuriat'), 'revenus_side', 'Revenus secondaires', '€/mois', '💶', 500, true),
  ((SELECT id FROM domains WHERE slug = 'entrepreneuriat'), 'heures_projet', 'Heures projet', 'h/semaine', '⏱️', 7, true),
  ((SELECT id FROM domains WHERE slug = 'entrepreneuriat'), 'apprentissage', 'Ressources appliquées', '/mois', '📚', 4, true),
  ((SELECT id FROM domains WHERE slug = 'entrepreneuriat'), 'objectifs_mois', 'Objectifs mensuels atteints', '%', '🎯', 80, true),
  ((SELECT id FROM domains WHERE slug = 'entrepreneuriat'), 'actions_val', 'Actions de validation', '/mois', '🚀', 8, true),
  ((SELECT id FROM domains WHERE slug = 'entrepreneuriat'), 'taux_horaire', 'Taux horaire perso', '€/h', '⏳', NULL, true)
ON CONFLICT (domain_id, metric_key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, icon = EXCLUDED.icon,
  target_value = EXCLUDED.target_value, higher_is_better = EXCLUDED.higher_is_better;

-- DOMAINE: bienetre
INSERT INTO metrics (domain_id, metric_key, label, unit, icon, target_value, higher_is_better)
VALUES
  ((SELECT id FROM domains WHERE slug = 'bienetre'), 'bienetre_global', 'Bien-être global', '/10', '🌟', 8, true),
  ((SELECT id FROM domains WHERE slug = 'bienetre'), 'stress_perso', 'Niveau de stress', '/10', '🌡️', 2, false),
  ((SELECT id FROM domains WHERE slug = 'bienetre'), 'pratiques', 'Pratiques bien-être', '/semaine', '🧘', 5, true),
  ((SELECT id FROM domains WHERE slug = 'bienetre'), 'joie', 'Score de joie authentique', '/10', '☀️', 7.5, true),
  ((SELECT id FROM domains WHERE slug = 'bienetre'), 'relations', 'Qualité des relations', '/10', '🤝', 8, true)
ON CONFLICT (domain_id, metric_key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, icon = EXCLUDED.icon,
  target_value = EXCLUDED.target_value, higher_is_better = EXCLUDED.higher_is_better;

-- DOMAINE: ecologie
INSERT INTO metrics (domain_id, metric_key, label, unit, icon, target_value, higher_is_better)
VALUES
  ((SELECT id FROM domains WHERE slug = 'ecologie'), 'carbone', 'Empreinte carbone', 't CO²/an', '🌍', 2, false),
  ((SELECT id FROM domains WHERE slug = 'ecologie'), 'transport_co2', 'Transport carboné', '€/mois', '🚗', 50, false),
  ((SELECT id FROM domains WHERE slug = 'ecologie'), 'electricite', 'Consommation électrique', 'kWh/mois', '⚡', 150, false),
  ((SELECT id FROM domains WHERE slug = 'ecologie'), 'seconde_main', 'Achats seconde main', '%', '♻️', 50, true),
  ((SELECT id FROM domains WHERE slug = 'ecologie'), 'gaspillage', 'Gaspillage alimentaire', 'repas/sem', '🗑️', 0, false)
ON CONFLICT (domain_id, metric_key) DO UPDATE SET
  label = EXCLUDED.label, unit = EXCLUDED.unit, icon = EXCLUDED.icon,
  target_value = EXCLUDED.target_value, higher_is_better = EXCLUDED.higher_is_better;

-- ============================================================
-- DÉFIS — DOMAINE: sante
-- ============================================================

-- Niveau 0
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Combien de pas fais-tu par jour, vraiment ?',
  '1 min',
  'Mesure baseline',
  'Ouvre l''application Santé de ton téléphone (ou Google Fit). Note ta moyenne exacte de pas sur les 7 derniers jours. Ce chiffre est ton point zéro — il est parfait, quel qu''il soit.',
  'La sédentarité tue plus silencieusement que le tabac. Moins de 5 000 pas/jour = ''sédentarité clinique'' selon l''OMS. Mais la bonne nouvelle : passer de 4 000 à 7 000 pas réduit la mortalité de 50 % (JAMA Internal Medicine, 2021). Tu n''es pas loin — tu l''ignores juste.',
  'pas', 'Tes pas / jour', 'Moyenne des 7 derniers jours dans ton appli Santé', true, 0, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Combien de litres d''eau bois-tu par jour en réalité ?',
  '2 min',
  'Mesure baseline',
  'Pas l''idéal — la réalité. Pense à ta journée d''hier. Compte chaque verre, chaque bouteille. Café et thé comptent à 50 %. Sois honnête avec toi-même.',
  '75 % des Français sont en état de déshydratation chronique légère sans s''en rendre compte. Résultat : fatigue, maux de tête, fringales (le cerveau confond soif et faim), baisse de concentration de 20 %. C''est souvent la première cause de fatigue chronique — et la plus facile à corriger.',
  'hydra', 'Ton hydratation réelle', 'Litres d''eau bus hier (en honnêteté totale)', true, 0, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Combien de repas équilibrés cette semaine — compte-les',
  '2 min',
  'Mesure baseline',
  'Un repas équilibré selon Flavio Guionneau : ½ assiette de légumes, ¼ protéines, ¼ glucides complexes. Regarde ta semaine passée. Combien de tes repas ressemblaient à ça ?',
  'Pas de régime. Pas d''aliment interdit. Flavio Guionneau répète : ''Tu n''as pas à manger parfaitement — tu dois manger mieux que la semaine d''avant.'' 1 repas équilibré de plus par semaine change la trajectoire. C''est tout ce qu''on te demande.',
  'repas', 'Repas équilibrés cette semaine', 'Sur les 14 repas de ta semaine', true, 0, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Estime ton taux de masse grasse — méthode simple',
  '5 min',
  'Mesure baseline',
  'Méthode tour de taille : mesure ton tour de taille (en cm) et ta taille (en cm). Ton ratio tour de taille/taille doit être < 0,5. Alternatively, utilise une balance à impédance ou les photos de référence visuelles en ligne (cherche ''body fat percentage visual guide'').',
  'Le taux de masse grasse est plus prédictif de la santé que le poids seul. L''IMC est imparfait — deux personnes au même IMC peuvent avoir des compositions corporelles radicalement différentes. Ce chiffre est une direction, pas un verdict. Tibo InShape : ''La balance ment. Le miroir et les photos ne mentent pas.''',
  'masse', 'Taux de masse grasse estimé', 'Auto-évaluation — photos de référence ou balance à impédance', true, 0, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 1
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  '10 minutes de marche — maintenant, pas ce soir',
  '10 min',
  'Action immédiate',
  'Lève-toi maintenant. Pas besoin de tenue, de montre, ni de musique. Marche 10 minutes à l''extérieur. Reviens noter tes pas pendant cette marche.',
  'Tibo InShape le dit souvent : ''Le meilleur entraînement, c''est celui que tu fais.'' Une étude Stanford (2014) confirme : 10 minutes de marche améliorent l''humeur pendant 2 heures et réduisent les pensées négatives de 12 %. Ce n''est pas un warm-up — c''est déjà du sport.',
  'pas', 'Tes pas pendant ces 10 minutes', 'Rien qu''avec cette marche', true, 1, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'La bouteille visible — ton système d''hydratation',
  '3 min',
  'System design',
  'Prends une bouteille de 1,5 L. Remplis-la. Pose-la à côté de toi pour toute la journée. Règle simple : elle doit être vide ce soir. Note combien tu as bu au total.',
  'James Clear (Atomic Habits) l''a prouvé : rendre un comportement visible multiplie sa fréquence. ''On ne boit pas par discipline — on boit quand c''est sous les yeux.'' Une bouteille visible double l''hydratation quotidienne sans effort de volonté. L''environnement détermine le comportement.',
  'hydra', 'Litres bus aujourd''hui', 'Avec la bouteille visible toute la journée', true, 1, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Construis ton assiette équilibrée ce soir',
  '20 min',
  'Action cuisine',
  'Ce soir au dîner : ½ assiette de légumes (cuits ou crus), ¼ de protéines (viande, poisson, œufs, légumineuses), ¼ de glucides complexes (riz, pâtes, patate douce). Prends une photo. Note combien de temps ça t''a pris.',
  'Flavio Guionneau insiste : ''Le rééquilibrage alimentaire ne se fait pas en supprimant — il se fait en ajoutant.'' Ajouter des légumes à une assiette est la modification la plus facile et la plus impactante. Les fibres ralentissent l''absorption des glucides, prolongent la satiété et nourrissent le microbiote.',
  'repas', 'Repas équilibrés cette semaine', 'Compte ce repas + tous ceux de la semaine', true, 1, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Ta première séance de sport — 20 minutes, corps au sol',
  '20 min',
  '1ère séance',
  'Pas de salle, pas d''équipement. 5 squats, 5 pompes (genoux si besoin), 20 secondes de gainage. Répète 3 fois. Repose. C''est tout. Note combien de séries tu as faites.',
  'Tibo InShape : ''Tout le monde peut faire 20 minutes. Le problème n''est pas la capacité — c''est la décision de commencer.'' La science confirme : les 5 premières séances créent les connexions neuromusculaires qui rendent les suivantes 3× plus faciles. La douleur musculaire des premiers jours est la preuve que ça marche.',
  'seances', 'Séances sport cette semaine', 'Cette séance compte — même la plus petite', true, 1, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Note tes pas 7 jours de suite — juste observer',
  '30 sec/j × 7',
  'Tracking',
  'Pendant 7 jours, note tes pas chaque soir. Pas d''objectif encore. Juste la mesure. Rentre la moyenne des 7 jours à la fin.',
  'Les porteurs de podomètre font en moyenne +1 400 pas/jour de plus simplement grâce à la prise de conscience — sans aucune instruction supplémentaire. C''est l''effet Hawthorne : être observé, même par soi-même, change le comportement. Tu n''as rien à faire de plus que compter.',
  'pas', 'Moyenne tes pas sur 7 jours', 'Ta nouvelle moyenne après 1 semaine de conscience', true, 1, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 2
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Programme 3 séances dans ton calendrier — cette semaine',
  '3 min',
  'Planification',
  'Ouvre ton agenda. Bloque 3 créneaux de 30 minutes minimum pour du sport cette semaine. Durée, type, lieu. Ces créneaux sont des rendez-vous avec toi-même — aussi importants qu''une réunion pro.',
  'Les séances planifiées ont 3× plus de chances d''être tenues que les séances improvisées (American Journal of Preventive Medicine). Tibo InShape le dit toujours : ''Si ce n''est pas dans ton agenda, ça n''existe pas.'' La planification est le vrai muscle à entraîner.',
  'seances', 'Séances tenues cette semaine', 'Pas prévues — réellement faites', true, 2, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'La règle des 2 jours — ne jamais sauter deux fois de suite',
  '2 min',
  'Règle système',
  'La règle d''or de Tibo InShape : tu peux sauter 1 séance. Jamais 2 d''affilée. Réfléchis à ta semaine passée. As-tu sauté 2 séances consécutives ? Si oui, qu''est-ce qui s''est passé ? Si non, félicite-toi — c''est cette régularité qui construit l''identité sportive.',
  'James Clear (Atomic Habits) : ''Ne jamais rater deux fois est la règle n°1.'' Rater une fois est un accident. Rater deux fois, c''est le début d''une nouvelle habitude — la mauvaise. Ce n''est pas la perfection qui construit une identité sportive, c''est la capacité à rebondir systématiquement.',
  NULL, NULL, NULL, false, 2, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'L''assiette anti-fringale — protéines au petit-déjeuner',
  '10 min',
  'Action nutrition',
  'Demain matin, remplace ton petit-déjeuner habituel par un repas avec au moins 20g de protéines : 3 œufs, 150g de fromage blanc, 200g de skyr, ou une poignée d''amandes + jambon. Note si tu as eu faim avant midi.',
  'Flavio Guionneau : ''Les fringales de 11h et de 16h ne sont pas un manque de volonté — elles sont la conséquence directe d''un petit-déjeuner trop sucré.'' Les protéines stimulent la leptine (hormone de satiété) et stabilisent la glycémie pendant 4 à 6 heures. Pas de magie — juste de la biochimie.',
  'repas', 'Repas équilibrés cette semaine', 'Avec ce petit-déjeuner protéiné compris', true, 2, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Objectif 6 000 pas aujourd''hui — comment tu vas y arriver ?',
  '5 min + journée',
  'Objectif chiffré',
  'Avant de commencer ta journée : comment vas-tu atteindre 6 000 pas aujourd''hui ? Nomme 2 moments concrets (10 min le matin, marche à la pause déjeuner…). Ce soir : note le chiffre réel atteint.',
  'Passer de 4 000 à 6 000 pas réduit le risque de maladies cardiovasculaires de 30 % (British Journal of Sports Medicine, 2022). 6 000 pas, c''est 45 minutes de marche réparties dans la journée — faisable même les jours de bureau si on l''anticipe.',
  'pas', 'Tes pas aujourd''hui', 'Objectif : 6 000 — qu''as-tu atteint ?', true, 2, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Remplace 1 aliment ultra-transformé par semaine',
  '5 min',
  'Substitution',
  'Flavio Guionneau ne dit pas ''supprime'' — il dit ''remplace''. Identifie 1 aliment ultra-transformé que tu consommes régulièrement (plat cuisiné, chips, sodas, céréales sucrées). Trouve 1 alternative concrète. Note laquelle.',
  'L''alimentation ultra-transformée représente 30 à 60 % de l''apport calorique des Français — pas par gourmandise, mais par disponibilité et praticité (INSERM, 2023). Flavio : ''Quand tu réduis les ultra-transformés, ton corps répond en quelques jours : énergie, digestion, faim régulée.'' Pas besoin de tout changer — juste une chose à la fois.',
  'repas', 'Repas équilibrés cette semaine', 'La substitution compte comme un repas amélioré', true, 2, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Bilan 21 jours — compare tes 5 métriques au départ',
  '5 min',
  'Comparaison avant/après',
  'Reviens sur tes mesures du Niveau 0. Pour chaque métrique : où tu en étais, où tu en es aujourd''hui. Calcule le delta. Quel est le chiffre dont tu es le plus fier ?',
  'La comparaison rétrospective est le moteur de motivation le plus puissant. L''être humain est mauvais pour sentir les changements progressifs — on s''y habitue. Mais les chiffres, eux, ne mentent pas. Ce bilan est souvent le moment où les gens décident de continuer sérieusement.',
  'pas', 'Tes pas/jour actuels', 'Compare à ta baseline du niveau 0', true, 2, 5
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 3
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'La surcharge progressive — augmente d''une rep par semaine',
  '3 min',
  'Principe sport',
  'Reprends ton exercice préféré. Si tu faisais 3 × 10, passe à 3 × 11 cette semaine. Une répétition. Juste une. Note ton exercice et ton nouveau nombre de répétitions.',
  'Tibo InShape le dit souvent : ''Le muscle ne grandit que si tu lui donnes une raison de le faire.'' La surcharge progressive est le principe n°1 du développement musculaire — validé par 80 ans de recherches. Le corps est une machine d''adaptation : si le stimulus ne change pas, l''adaptation s''arrête. +1 rep/semaine = doublement des capacités en 1 an.',
  'seances', 'Séances avec surcharge progressive cette semaine', 'Séances où tu as augmenté le défi vs la semaine dernière', true, 3, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Mesure ton hydratation sur 5 jours — atteins 1,5 L chaque jour',
  'Tracking 5j',
  'Objectif précis',
  'Pendant 5 jours : tu bois 1,5 L minimum. Note chaque soir si tu as atteint l''objectif ou non. À la fin des 5 jours, rentre ta moyenne journalière.',
  '1,5 L/jour est le seuil minimum recommandé par l''ANSES pour maintenir les fonctions cognitives optimales. Au-delà, les bénéfices additionnels sont moindres — l''objectif n''est pas de boire le plus possible, c''est d''éliminer la déshydratation chronique qui affecte chaque cellule de ton corps.',
  'hydra', 'Hydratation moyenne sur 5 jours', 'Objectif : 1,5 L — qu''as-tu atteint en moyenne ?', true, 3, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Décrypte tes macronutriments — 1 journée complète',
  '10 min',
  'Éducation nutrition',
  'Utilise une appli (MyFitnessPal, Cronometer) pour tracker TOUT ce que tu manges pendant 1 journée. Note tes apports en protéines, glucides, lipides. Pas pour restreindre — pour comprendre.',
  'Flavio Guionneau : ''Comprendre ce que tu manges, c''est te donner le pouvoir de faire des choix conscients.'' La plupart des Français mangent 2× moins de protéines qu''il ne faudrait (objectif : 1,6g/kg de poids de corps pour le maintien musculaire) et 3× trop de sucres rapides. Une seule journée de tracking révèle tout.',
  'repas', 'Repas équilibrés cette semaine', 'Avec ta journée de suivi des macros', true, 3, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Le sommeil et la récupération — mesure ton impact',
  '3 min',
  'Récupération',
  'Pendant 3 jours, note : heure de coucher réelle, heure de réveil, énergie le lendemain sur 10. Cherche le pattern : à partir de combien d''heures tu te sens vraiment bien ?',
  'Matthew Walker (Why We Sleep) : ''Le sommeil est l''acte de performance le plus efficace que la science connaît.'' En dessous de 7h : cortisol en hausse, testostérone en chute, appétit calorique +24 %. La récupération n''est pas passive — c''est quand le muscle se reconstruit. Dormir moins pour s''entraîner plus est contre-productif.',
  NULL, NULL, NULL, false, 3, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Mesure ta progression — photos et tour de taille',
  '5 min',
  'Mesure progression',
  'Prends 3 photos (face, profil, dos) dans les mêmes conditions qu''au départ. Mesure ton tour de taille au nombril. Compare à ta première mesure. Note le delta et ta nouvelle estimation de masse grasse.',
  'La balance est le pire indicateur de progression au début — elle ne distingue pas la perte de graisse du gain musculaire. Le tour de taille et les photos sont objectifs et motivants. Tibo InShape : ''Tes photos dans 3 mois seront ta meilleure récompense — et ta meilleure motivation pour continuer.''',
  'masse', 'Taux de masse grasse actualisé', 'Nouvelle estimation — même méthode qu''au départ', true, 3, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 4
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Ton ''pourquoi'' profond — écris-le en 5 lignes',
  '5 min',
  'Fondation identité',
  'Au-delà de ''perdre du poids'' ou ''être en forme'' — quelle est la vraie raison pour laquelle tu prends soin de ton corps ? L''énergie pour tes enfants ? La santé mentale ? L''exemple que tu veux donner ? Nomme-la précisément.',
  'Les personnes qui ont un ''pourquoi'' profond tiennent leurs habitudes 4× plus longtemps que celles motivées par l''apparence seule (Health Psychology, 2019). Tibo InShape : ''Le jour où tu fais du sport pour comment tu te sens — pas pour comment tu es perçu — tu ne t''arrêtes plus.'' C''est le passage de la motivation à l''identité.',
  NULL, NULL, NULL, false, 4, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Conçois ton programme personnel — 4 semaines',
  '15 min',
  'Planification longue',
  'Sur une feuille ou une appli : planifie tes 4 prochaines semaines de sport. Jours, types de séances, progression. Pas parfait — réaliste. Note tes 3 séances de la semaine 1.',
  'Le programme écrit multiplie par 2,5 la probabilité de tenir ses séances sur 30 jours. La planification longue active le cortex préfrontal (décision rationnelle) plutôt que le système limbique (résistance émotionnelle). C''est la différence entre décider le dimanche et improviser le mercredi soir épuisé.',
  'seances', 'Séances planifiées pour les 4 semaines', 'Nombre total de séances dans ton plan', true, 4, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Bilan trimestriel — les 5 métriques, avant vs maintenant',
  '10 min',
  'Bilan complet',
  'Reprends chaque métrique du Niveau 0. Calcule le delta exact pour chacune. Note le total de tes progrès : pas/jour, séances/sem, repas équilibrés/sem, hydratation, masse grasse.',
  'Le bilan trimestriel est ce que les meilleurs athlètes font systématiquement — pas pour souffrir sur leurs manques, mais pour mesurer objectivement. La progression est souvent bien meilleure qu''estimée. C''est ça qui donne l''envie de continuer encore 3 mois.',
  'masse', 'Taux de masse grasse bilan trimestriel', 'Ta dernière mesure pour clôturer ce niveau', true, 4, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'sante'),
  'Quel défi sportif veux-tu relever dans les 12 prochains mois ?',
  '3 min',
  'Projection',
  'Un 5 km, une série de pompes consécutives, un sport que tu n''as jamais essayé ? Fixe-toi 1 objectif sportif ambitieux mais atteignable pour les 12 prochains mois. Note la première action concrète cette semaine.',
  'Tibo InShape : ''L''objectif n''est pas la destination — il est la direction.'' Les personnes qui se fixent un défi sportif concret s''entraînent 37 % plus régulièrement que celles avec un objectif flou. Le défi crée la structure, la structure crée l''habitude, l''habitude crée l''identité.',
  'seances', 'Séances sport cette semaine vers ton objectif', 'Première semaine vers ton défi annuel', true, 4, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;


-- ============================================================
-- DÉFIS — DOMAINE: finances
-- ============================================================

-- Niveau 0
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Quel est ton taux d''épargne réel ce mois ?',
  '5 min',
  'Mesure baseline',
  'Prends ton revenu net de ce mois. Soustrais tout ce que tu as dépensé. Ce qui reste — divisé par ton revenu — c''est ton taux d''épargne réel. Pas l''idéal. Le réel. Note ce pourcentage, même s''il est négatif.',
  'Morgan Housel (The Psychology of Money) : ''Le taux d''épargne est la seule variable financière que tu contrôles complètement — pas les marchés, pas l''économie, pas ton salaire. Uniquement ce que tu gardes.'' La moyenne française est 15 % — mais pour les 25-35 ans sans plan financier conscient, elle tombe souvent à 3-5 %. Ce chiffre, quel qu''il soit, est ton point de départ.',
  'epargne_taux', 'Ton taux d''épargne mensuel', '(Revenu - Dépenses) / Revenu × 100', true, 0, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Calcule ton patrimoine net — actifs moins passifs',
  '10 min',
  'Mesure baseline',
  'Liste tout ce que tu possèdes et sa valeur approximative (livrets, épargne, placements, voiture, immo). Puis liste tout ce que tu dois (crédit conso, crédit auto, crédit immo, dettes diverses). Patrimoine net = actifs − passifs. Note le chiffre exact.',
  'Robert Kiyosaki (Rich Dad Poor Dad) : ''La plupart des gens pensent que leur maison est leur actif le plus précieux. Mais un actif met de l''argent dans ta poche — une maison qui te coûte des charges, des impôts et un crédit en sort.'' Le patrimoine net est le seul chiffre financier qui compte vraiment sur le long terme. La plupart des gens ne l''ont jamais calculé.',
  'patrimoine', 'Ton patrimoine net', 'Total actifs − Total passifs, en euros', true, 0, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Combien de mois de dépenses as-tu en épargne de précaution ?',
  '3 min',
  'Mesure baseline',
  'Total de ton épargne disponible immédiatement (livrets, compte courant hors dépenses du mois). Divise par tes dépenses mensuelles moyennes. Tu obtiens combien de mois d''autonomie financière en cas de coup dur ?',
  'Ramit Sethi (I Will Teach You To Be Rich) : ''L''épargne de précaution n''est pas sexy — mais c''est le fondement de toute liberté financière. Sans elle, la première urgence (voiture, santé, chômage) efface des années d''efforts.'' Mounir Laggoune (Finary) : ''Avant d''investir quoi que ce soit, il faut 3 à 6 mois de dépenses en sécurité totale. C''est la règle n°1 que 80 % des débutants ignorent.''',
  'precaution', 'Épargne de précaution en mois', 'Épargne disponible immédiatement / dépenses mensuelles', true, 0, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Quel est ton montant investi ce mois — en euros exacts ?',
  '2 min',
  'Mesure baseline',
  'Combien as-tu placé ce mois sur des supports qui travaillent pour toi — PEA, assurance-vie, livrets au-delà de la précaution, actions, ETF ? Si la réponse est 0, note 0. C''est une information, pas un jugement.',
  'Mounir Laggoune (Finary) : ''L''investissement passif en ETF, c''est la décision financière la plus asymétrique qui existe pour un salarié français : le rendement historique du MSCI World est de 8 % par an sur 30 ans — bien au-dessus de l''inflation, bien au-dessus du livret A.'' Kiyosaki : ''La grande majorité des gens travaillent pour gagner de l''argent. Les riches font en sorte que l''argent travaille pour eux.''',
  'investi', 'Montant investi ce mois', 'PEA, AV, ETF, actions — tout ce qui travaille pour toi', true, 0, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 1
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Catégorise toutes tes dépenses de ce mois — en 20 minutes',
  '20 min',
  'Audit complet',
  'Ouvre tes relevés bancaires du mois. Catégorise chaque dépense : logement, alimentation, transport, abonnements, restaurants/sorties, achats impulsifs, santé, autres. Note le total de chaque catégorie. Quelle catégorie te surprend le plus ?',
  'Nathalie Carre : ''L''audit des dépenses est l''acte financier le plus inconfortable — et le plus libérateur. On ne peut pas changer ce qu''on ne voit pas.'' Morgan Housel ajoute : ''Nos dépenses sont le reflet le plus honnête de nos vraies valeurs — pas celles qu''on déclare, celles qu''on vit. Regarder ses dépenses, c''est se regarder vraiment.''',
  'epargne_taux', 'Taux d''épargne après audit', 'Recalcule avec les vraies dépenses catégorisées', true, 1, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Identifie tes abonnements fantômes — le total annualisé',
  '5 min',
  'Audit abonnements',
  'Liste tous tes abonnements récurrents de moins de 20 € — streaming, apps, clubs, abonnements oubliés. Totalise le mensuel. Maintenant multiplie par 12. Quel est ce chiffre annuel ? Qu''est-ce que tu n''as pas utilisé le mois dernier ?',
  'Ramit Sethi : ''Les petits abonnements sont les prédateurs silencieux du budget. Chacun semble insignifiant — ensemble, ils représentent souvent 150 à 300 € par mois.'' Mounir Laggoune (Finary) : ''150 € d''abonnements inutiles par mois investis en ETF pendant 20 ans à 8 % = 88 000 €. Ce n''est pas de l''épargne — c''est de la croissance de patrimoine abandonnée.''',
  'epargne_taux', 'Économies potentielles annualisées', 'Abonnements inutiles × 12, en euros', true, 1, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Identifie ton déclencheur émotionnel d''achat principal',
  '5 min',
  'Diagnostic émotionnel',
  'Nathalie Carre pose cette question à tous ses clients : dans quelle situation émotionnelle achètes-tu sans vraiment en avoir besoin ? Stress, ennui, célébration, tristesse, comparaison sociale ? Note ton déclencheur principal et le dernier achat qu''il a provoqué.',
  'Nathalie Carre : ''L''achat impulsif n''est presque jamais une question d''argent — c''est une régulation émotionnelle. On achète pour calmer quelque chose qu''on ne sait pas gérer autrement.'' Morgan Housel confirme : ''Les décisions financières les plus coûteuses sont rarement des erreurs de calcul — ce sont des réponses émotionnelles à des situations difficiles.''',
  NULL, NULL, NULL, false, 1, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Calcule le coût réel de tes achats impulsifs du mois',
  '5 min',
  'Calcul',
  'Reprends ton audit de dépenses. Identifie tous les achats que tu n''aurais pas faits si tu avais attendu 24 heures avant d''acheter. Totalise-les. Annualise (× 12). Compare à ce que ce montant représenterait en épargne.',
  'Morgan Housel : ''Le coût réel d''un achat impulsif n''est pas son prix — c''est son coût d''opportunité. 50 € dépensés impulsément aujourd''hui, c''est 220 € de moins dans 20 ans à 8 % de rendement annuel.'' Ramit Sethi propose la règle des 72 heures : ''Pour tout achat non planifié au-dessus de 50 €, attends 72 heures. 80 % du temps, l''envie a disparu.''',
  'epargne_taux', 'Achats impulsifs ce mois (€)', 'Total des achats que tu n''aurais pas faits avec 24h de réflexion', true, 1, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Identifie tes revenus passifs actuels — même 0 €',
  '3 min',
  'Mesure',
  'Combien d''argent entre dans ton compte ce mois sans que tu aies travaillé pour le gagner ce mois-ci ? Intérêts de livrets, dividendes, loyers, royalties, remboursements… Note le total exact. Même si c''est 1,20 € d''intérêts sur ton livret A.',
  'Robert Kiyosaki : ''La liberté financière commence le jour où tes revenus passifs dépassent tes dépenses. Mais elle commence vraiment le jour où tu mesures tes revenus passifs pour la première fois — parce que tu commences à les voir comme une direction, pas comme un accident.'' Mounir Laggoune : ''En France, le premier euro de revenu passif vient souvent du Livret A. Ce n''est pas glamour — mais c''est le premier signe que ton argent commence à travailler pour toi.''',
  'revenus_passifs', 'Revenus passifs ce mois', 'Intérêts, dividendes, loyers, royalties — tout ce qui entre sans travailler', true, 1, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 2
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Se payer en premier — programme le virement automatique aujourd''hui',
  '5 min',
  'Action fondatrice',
  'Le jour de ton prochain salaire, programme un virement automatique vers ton livret d''épargne. Même 50 €. Même 30 €. Le montant importe moins que l''automatisme. Note le montant choisi et la date programmée.',
  'Ramit Sethi appelle ça ''Pay Yourself First'' — la règle n°1 de son système. ''Ne mets pas l''argent de côté ce qui reste après les dépenses — mets-le de côté avant que tu puisses le dépenser. Ce virement automatique est la décision financière la plus importante de ta vie.'' Morgan Housel : ''L''épargne automatique contourne le biais du présent — notre tendance naturelle à valoriser le plaisir immédiat sur le bénéfice futur.''',
  'epargne_taux', 'Montant du virement automatique (€/mois)', 'Le montant programmé ce jour', true, 2, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Supprime 3 abonnements inutiles — maintenant, pas demain',
  '10 min',
  'Action directe',
  'Reprends ta liste d''abonnements du niveau 1. Choisis les 3 que tu as le moins utilisés le mois dernier. Annule-les maintenant. Note le montant mensuel économisé et redirige-le immédiatement vers l''épargne automatique.',
  'Ramit Sethi : ''Annuler 3 abonnements inutiles et programmer le montant économisé en épargne automatique est l''action avec le meilleur ratio impact/effort qui existe en finance personnelle. Tu prends une décision une fois — elle produit des bénéfices indéfiniment.'' Mounir Laggoune : ''60 € d''abonnements annulés par mois investis en ETF World pendant 15 ans = 20 000 €. Une décision de 10 minutes, une fois.''',
  'epargne_taux', 'Économies mensuelles générées (€)', 'Total des abonnements supprimés ce mois', true, 2, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Construis ton budget conscient — la méthode 50/30/20 adaptée',
  '15 min',
  'Budget',
  'Prends ton revenu net mensuel. Alloue : 50 % maximum aux besoins (loyer, courses, transport), 30 % maximum aux envies (restaurants, sorties, loisirs), 20 % minimum à l''épargne et l''investissement. Dans ta réalité actuelle, quel est ton ratio réel sur chaque catégorie ?',
  'Nathalie Carre adapte cette méthode au contexte français : ''Le budget conscient n''est pas une prison — c''est une permission. Quand tu sais que tu as 30 % alloués aux envies, tu dépenses sans culpabilité. C''est la fin de la relation anxieuse à l''argent.'' Morgan Housel : ''Un budget n''est pas une contrainte morale — c''est un outil de clarté.''',
  'epargne_taux', 'Ton taux d''épargne cible (%)', 'La part que tu alloues à l''épargne dans ton budget conscient', true, 2, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Applique la règle des 72 heures sur tous tes achats non planifiés',
  'Continu',
  'Règle système',
  'Cette semaine, pour chaque achat non planifié au-dessus de 30 €, attends 72 heures. Note chaque achat ''mis en attente''. À la fin de la semaine : combien as-tu finalement achetés ? Combien as-tu laissés tomber ?',
  'Ramit Sethi : ''La règle des 72 heures ne t''empêche pas de dépenser — elle transforme les achats impulsifs en achats conscients. Et 80 % du temps, l''envie disparaît d''elle-même.'' Nathalie Carre ajoute : ''72 heures, c''est suffisant pour que l''émotion qui a déclenché l''envie d''achat se dissipe. Ce n''est pas de la privation — c''est donner à ton cerveau rationnel le temps de rattraper ton cerveau émotionnel.''',
  NULL, NULL, NULL, false, 2, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Mesure ton taux d''épargne après 1 mois de système',
  '3 min',
  'Comparaison',
  'Recalcule ton taux d''épargne avec les nouveaux systèmes en place : virement automatique, abonnements supprimés, règle des 72 heures. Quel est le delta vs ta baseline du niveau 0 ?',
  'Morgan Housel : ''La richesse n''est pas ce qu''on voit — c''est ce qu''on ne dépense pas. Le taux d''épargne est le seul chiffre qui mesure vraiment si on construit quelque chose ou si on consomme tout ce qu''on gagne.'' Ramit Sethi : ''Voir son taux d''épargne augmenter après la mise en place des systèmes automatiques est souvent le premier moment où les gens croient vraiment que leur situation peut changer.''',
  'epargne_taux', 'Taux d''épargne avec les nouveaux systèmes', 'Compare à ta baseline du niveau 0', true, 2, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 3
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Ouvre un PEA aujourd''hui — même avec 1 €',
  '10 min',
  'Action fondatrice',
  'L''horloge du PEA démarre à la date du premier versement — pas à la date où tu commences vraiment à investir. Ouvre un PEA aujourd''hui avec 1 € sur Boursorama, Fortuneo ou Bourse Direct. Dans 5 ans, tu seras exonéré d''impôts sur les plus-values. Note la date d''ouverture.',
  'Mounir Laggoune (Finary) : ''Ouvrir un PEA avec 1 € aujourd''hui et l''alimenter dans 6 mois, c''est économiser 6 mois sur le délai fiscal de 5 ans. C''est la décision financière la plus asymétrique qui existe — zéro risque, bénéfice certain.'' Kiyosaki : ''Les riches créent des structures avant d''en avoir besoin. Le PEA est la structure — ouvrir l''enveloppe est l''acte fondateur.''',
  'investi', 'Montant investi ce mois via PEA', 'PEA ouvert — même avec 1 €, l''horloge démarre', true, 3, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Comprends la différence entre actif et passif dans ta vie',
  '10 min',
  'Éducation',
  'Liste tout ce que tu possèdes. Pour chaque item : est-ce un actif (ça met de l''argent dans ta poche ou prend de la valeur) ou un passif (ça en sort ou perd de la valeur) ? Ta voiture : actif ou passif ? Ton livret A : actif ou passif ? Ta télé : actif ou passif ?',
  'Robert Kiyosaki : ''La définition simplissime de la liberté financière : avoir suffisamment d''actifs pour que leurs revenus couvrent tes dépenses. Tout le reste est de la sophistication inutile.'' Morgan Housel nuance : ''Kiyosaki a raison sur le fond — les actifs sont la clé. Mais en France, le premier actif accessible à tous n''est pas l''immo ou une entreprise : c''est un ETF World dans un PEA.''',
  'patrimoine', 'Patrimoine net actualisé', 'Recalcule avec ta nouvelle vision actifs/passifs', true, 3, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Programme ton premier investissement mensuel automatique',
  '10 min',
  'Action',
  'Choisis un montant — même 50 € — et programme un virement mensuel automatique vers ton PEA ou ton assurance-vie le jour de ton salaire. Note le montant et la date de démarrage. Puis cherche l''ETF MSCI World sur ta plateforme et passe ton premier ordre.',
  'Mounir Laggoune (Finary) : ''Le DCA — investir régulièrement un montant fixe — est la stratégie d''investissement la plus efficace pour quelqu''un qui commence. Elle neutralise le risque de timing, supprime les décisions émotionnelles et transforme l''investissement en habitude.'' Ramit Sethi : ''Automatiser l''investissement, c''est la décision que tu prends une fois et qui travaille pour toi chaque mois pendant 30 ans.''',
  'investi', 'Montant investi automatiquement par mois', 'Le virement mensuel programmé vers ton PEA ou AV', true, 3, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Calcule l''objectif d''épargne de précaution — et la distance',
  '5 min',
  'Planification',
  'Tes dépenses mensuelles moyennes × 6 = ton objectif d''épargne de précaution. Compare à ton épargne de précaution actuelle du niveau 0. Quel est le delta en euros ? Combien de temps à ton rythme d''épargne actuel pour l''atteindre ?',
  'Ramit Sethi : ''L''épargne de précaution n''est pas là pour faire des rendements — elle est là pour que tu ne vendes jamais tes investissements en urgence.'' Mounir Laggoune : ''En France, le Livret A et le LDDS sont les seuls véhicules pour l''épargne de précaution — liquides, garantis, sans impôt. Tout le reste est soit trop risqué, soit trop illiquide pour ce rôle.''',
  'precaution', 'Épargne de précaution actuelle (mois)', 'Compare à l''objectif de 6 mois de dépenses', true, 3, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Mesure la croissance de ton patrimoine net',
  '5 min',
  'Mesure évolution',
  'Recalcule ton patrimoine net comme au niveau 0 — actifs moins passifs. Quel est le delta vs ta baseline ? Quelle partie vient de l''épargne, quelle partie vient de la valeur des actifs ?',
  'Morgan Housel : ''Le patrimoine net est le seul score financier qui compte. Mais la vraie victoire n''est pas le chiffre absolu — c''est la direction. Un patrimoine net en hausse régulière, même lentement, est le signe qu''on construit quelque chose.'' Kiyosaki : ''Surveille ton patrimoine net chaque trimestre comme un PDG surveille le bilan de son entreprise.''',
  'patrimoine', 'Patrimoine net actualisé', 'Compare à ta baseline du niveau 0', true, 3, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 4
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Simule tes intérêts composés sur 20 ans',
  '10 min',
  'Simulation',
  'Utilise le calculateur de Finary ou un simulateur en ligne. Entre ton montant mensuel investi actuel et 8 % de rendement annuel moyen. Quel est le résultat dans 10 ans ? Dans 20 ans ? Dans 30 ans ? Note les trois chiffres.',
  'Mounir Laggoune (Finary) : ''Les intérêts composés sont la 8e merveille du monde — Albert Einstein aurait dit ça. Ce n''est pas une métaphore : 200 € par mois à 8 % pendant 30 ans = 273 000 €. La magie vient du temps, pas du montant.'' Morgan Housel : ''La raison pour laquelle Warren Buffett est si riche n''est pas son intelligence — c''est qu''il investit depuis ses 11 ans. La durée est le vrai levier.''',
  'revenus_passifs', 'Revenus passifs projetés dans 5 ans (€/mois)', 'Estimation basée sur tes placements actuels', true, 4, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Identifie et optimise ta fiscalité — PEA vs CTO vs AV',
  '15 min',
  'Optimisation',
  'Pour chaque type de placement que tu as ou envisages : quelle est la fiscalité applicable ? PEA après 5 ans : 17,2 % de prélèvements sociaux seulement. Assurance-vie après 8 ans : abattement de 4 600 € par an. CTO : flat tax 30 %. Quel est l''ordre optimal pour toi ?',
  'Mounir Laggoune (Finary) : ''L''optimisation fiscale n''est pas réservée aux riches — elle est accessible à tous les salariés français dès le premier euro investi. Le PEA est l''enveloppe la plus avantageuse pour les actions en France : après 5 ans, on ne paie que les prélèvements sociaux, pas l''impôt sur le revenu.'' Kiyosaki : ''Les riches ne cherchent pas à éviter les impôts — ils construisent des structures qui les optimisent légalement.''',
  'investi', 'Montant investi dans les bonnes enveloppes (€/mois)', 'Dans l''enveloppe fiscalement optimale pour toi', true, 4, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Calcule tes revenus passifs actuels et projette à 5 ans',
  '10 min',
  'Projection',
  'Reprends tes revenus passifs actuels. Ajoute les intérêts projetés de tes placements à leur rythme actuel. Dans 5 ans, à ce rythme, quel serait ton revenu passif mensuel estimé ? Quelle distance reste-t-il vers le premier palier symbolique de 100 €/mois ?',
  'Kiyosaki : ''Mes clients demandent souvent combien ils doivent avoir pour être libres financièrement. Ma réponse : le jour où tes revenus passifs dépassent tes dépenses. Commence par 10 €/mois — puis 100 €, puis 500 €.'' Morgan Housel : ''Les revenus passifs ont un pouvoir psychologique que leur montant ne reflète pas. 50 € par mois changent ton identité : tu n''es plus seulement quelqu''un qui travaille pour de l''argent.''',
  'revenus_passifs', 'Revenus passifs actuels (€/mois)', 'Tout ce qui entre sans avoir travaillé ce mois', true, 4, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'finances'),
  'Bilan trimestriel — compare tes 5 métriques au départ',
  '15 min',
  'Bilan complet',
  'Reprends chaque métrique du niveau 0 : taux d''épargne, patrimoine net, épargne de précaution, montant investi, revenus passifs. Calcule le delta exact pour chacune. Quelle est ta plus grande progression ? Quelle métrique résiste encore ?',
  'Morgan Housel : ''La richesse se construit lentement, puis tout d''un coup — grâce aux intérêts composés. Les 3 premiers mois ne montrent pas encore la magie des intérêts composés. Mais ils montrent quelque chose de plus important : que tu as la capacité de changer tes comportements financiers.'' Mounir Laggoune : ''Le bilan trimestriel est la pratique qui différencie les investisseurs qui progressent de ceux qui abandonnent.''',
  'patrimoine', 'Patrimoine net bilan trimestriel', 'Compare à ta baseline du niveau 0', true, 4, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;


-- ============================================================
-- DÉFIS — DOMAINE: travail
-- ============================================================

-- Niveau 0
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Quel est ton niveau d''énergie moyen au travail cette semaine ?',
  '1 min', 'Mesure baseline',
  'Sur 10, ton énergie professionnelle moyenne de cette semaine. Pas l''énergie idéale — la réelle. La première réponse qui vient, sans la corriger.',
  'Adam Grant dans Think Again : ''La capacité à évaluer honnêtement son état émotionnel est le prédicteur n°1 de la prise de décision professionnelle de qualité.'' L''énergie pro n''est pas un sentiment vague — c''est un signal précis sur l''alignement entre ce qu''on fait et ce qu''on est capable de faire. Ce chiffre devient ton point zéro.',
  'energie_pro', 'Ton énergie pro cette semaine', 'Sur 10 — la première réponse honnête', true, 0, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Sur 100 % de ton temps de travail, quel % as-tu vraiment choisi cette semaine ?',
  '5 min', 'Mesure baseline',
  'Reconstitue ta semaine. Réunions imposées, tâches non-choisies, interruptions subies vs travail profond décidé par toi. Estime honnêtement le pourcentage de temps que tu as réellement contrôlé.',
  'Laszlo Bock (Work Rules) : ''Le facteur le plus prédictif de l''engagement au travail n''est pas le salaire ni le titre — c''est le degré d''autonomie réelle dans les tâches quotidiennes.'' Chez Google, les équipes avec le plus haut ratio de tâches choisies ont une productivité 37 % supérieure et un turnover 2× plus faible.',
  'ratio_choisi', 'Ton ratio tâches choisies', '% de ton temps de travail réellement contrôlé', true, 0, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Sur quelles compétences as-tu progressé ce trimestre — compte-les précisément',
  '5 min', 'Mesure baseline',
  'Une compétence compte si tu peux la démontrer de façon mesurable aujourd''hui et que tu ne pouvais pas il y a 3 mois. Liste celles qui correspondent à cette définition. Pas les formations suivies — les compétences réellement intégrées.',
  'Cal Newport dans So Good They Can''t Ignore You distingue ''career capital'' (compétences rares et précieuses) et ''career fluff'' (activités qui ressemblent à du développement sans l''être). Laszlo Bock : ''Chez Google, on recrute des gens qui apprennent vite, pas des gens qui savent déjà. La vitesse d''acquisition de compétences est la métrique RH la plus prédictive du succès à long terme.''',
  'competences', 'Compétences développées ce trimestre', 'Celles démontrables aujourd''hui, impossibles il y a 3 mois', true, 0, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Quel est ton niveau de stress professionnel moyen cette semaine ?',
  '1 min', 'Mesure baseline',
  'Sur 10, ton stress professionnel moyen de cette semaine. 1 = parfaitement zen, 10 = débordé en permanence. La première réponse honnête.',
  'Adam Grant cite une méta-analyse de 228 études (Journal of Applied Psychology) : ''Le stress professionnel chronique au-delà de 6/10 réduit les capacités cognitives de 13 % et la créativité de 21 % — deux ressources exactement nécessaires pour progresser dans sa carrière.'' Mesurer son stress n''est pas une pratique de bien-être — c''est une donnée de performance.',
  'stress_pro', 'Ton stress pro cette semaine', 'Sur 10 — 1 zen, 10 débordé en permanence', true, 0, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Quel est ton revenu mensuel net réel — salaire + primes + avantages valorisés ?',
  '5 min', 'Mesure baseline',
  'Total de ta rémunération nette mensuelle : salaire net + 1/12 des primes annuelles + valeur mensuelle des avantages (mutuelle, tickets restaurant, voiture de fonction…). Note le chiffre exact.',
  'Laszlo Bock : ''La plupart des salariés sous-estiment leur rémunération totale de 15 à 25 % en oubliant les avantages non-monétaires. Et ils surestiment celle de leurs pairs de 20 %.'' Ce chiffre précis est la base de toute négociation salariale et de toute comparaison de marché. On ne peut pas optimiser ce qu''on ne mesure pas exactement.',
  'revenu_pro', 'Ton revenu mensuel total', 'Salaire net + 1/12 primes + avantages valorisés en €', true, 0, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 1
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Cartographie ta semaine — ce qui donne de l''énergie vs ce qui en prend',
  '10 min', 'Audit énergétique',
  'Reprends chaque bloc de ta semaine passée. Pour chacun note : +1 si ça t''a donné de l''énergie, -1 si ça t''en a pris. Totalise. Quels sont les 3 blocs les plus énergisants et les 3 plus drainants ?',
  'Adam Grant appelle ça le ''energy audit'' — une pratique qu''il recommande à tous ses étudiants de Wharton. ''La plupart des gens optimisent leur agenda pour la productivité ou l''urgence. Très peu l''optimisent pour l''énergie — alors que c''est la seule ressource qui détermine la qualité de tout le reste.''',
  'energie_pro', 'Score énergie actualisé', 'Après avoir cartographié tes drains et sources', true, 1, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Identifie ta dernière heure de flow au travail — précisément',
  '3 min', 'Identification',
  'La dernière fois que tu étais complètement absorbé par une tâche au point d''oublier l''heure. C''était quand, sur quoi, dans quel contexte ? Si tu ne t''en souviens pas, note depuis combien de temps approximativement.',
  'Laszlo Bock cite les recherches de Mihaly Csikszentmihalyi sur le flow dans Work Rules : ''Les employés en état de flow sont 5× plus productifs que la moyenne. Et Google a découvert que les conditions du flow sont reproductibles — ce n''est pas une question de chance ou d''humeur, c''est une question d''environnement.'' Si ton dernier flow remonte à plus d''un mois, c''est un signal structurel — pas conjoncturel.',
  NULL, NULL, NULL, false, 1, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Mesure ton ratio tâches choisies cette semaine — plus précisément qu''au niveau 0',
  '10 min', 'Mesure affinée',
  'Cette semaine, tiens un journal de 3 jours. Pour chaque bloc de travail : C (choisi) ou S (subi). À la fin des 3 jours, calcule le ratio réel. Compare à ton estimation du niveau 0.',
  'Laszlo Bock dans Work Rules : ''Donner aux gens de l''autonomie sur leur travail est plus motivant qu''une augmentation de salaire dans 80 % des cas — mais seulement quand cette autonomie est réelle et mesurée, pas supposée.'' La plupart des gens surestiment leur autonomie réelle de 20 à 30 points.',
  'ratio_choisi', 'Ratio tâches choisies — mesure affinée', 'Journal de 3 jours : C (choisi) ou S (subi) pour chaque bloc', true, 1, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Les 3 compétences que tu utilises le moins par rapport à leur potentiel',
  '5 min', 'Inventaire',
  'Quelles sont les 3 compétences où tu es dans le top 20 % de ton entourage professionnel mais que tu utilises moins d''1 heure par semaine dans ton poste actuel ? Ce sont tes compétences sous-exploitées.',
  'Adam Grant dans Give and Take : ''Les personnes les plus efficaces ne sont pas celles qui ont le plus de compétences — ce sont celles qui utilisent le plus de leurs compétences existantes.'' Laszlo Bock : ''Chez Google, les transferts internes vers des postes qui exploitent mieux les compétences existantes produisent +18 % de performance en moyenne — sans formation supplémentaire.''',
  'competences', 'Compétences sous-exploitées identifiées', 'Nombre de compétences top 20% utilisées < 1h/semaine', true, 1, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Identifie la source principale de ton stress professionnel — nomme-la précisément',
  '5 min', 'Diagnostic',
  'Une seule source — la principale. Pas ''trop de travail'' ou ''mon manager'' — quelque chose de précis : une tâche récurrente, une relation spécifique, une incertitude nommée, une décision non prise. Plus c''est précis, plus c''est actionnable.',
  'Adam Grant cite une étude de l''Université de Michigan : ''Nommer précisément sa source de stress réduit son impact cognitif de 23 % immédiatement — avant même d''agir dessus.'' Le mécanisme est neurologique : le cortex préfrontal reprend le contrôle sur l''amygdale dès que le stress est verbalisé précisément.',
  'stress_pro', 'Stress pro après avoir nommé la source', 'Le même score — a-t-il changé rien qu''en nommant ?', true, 1, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 2
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Bloque 2 heures de deep work dans ton agenda cette semaine',
  '5 min', 'Action immédiate',
  'Ouvre ton agenda maintenant. Bloque 2 créneaux de 60 minutes minimum, labellisés ''Focus'', pour les 3 prochains jours. Téléphone en mode avion, notifications coupées, porte fermée. Note ton énergie après la première session.',
  'Cal Newport (Deep Work) : ''Une heure de travail profond sans interruption produit plus de valeur que 4 heures de travail fragmenté.'' Laszlo Bock confirme avec les données Google : ''Les employés qui protègent au moins 2 heures de concentration profonde par jour ont une évaluation de performance 31 % supérieure — toutes choses égales par ailleurs.''',
  'energie_pro', 'Énergie pro après 1 semaine de deep work protégé', 'Compare à ta baseline', true, 2, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Propose une amélioration concrète à ton manager cette semaine',
  '10 min', 'Initiative',
  'Identifie un problème dans ton équipe ou ton processus. Rédige une proposition en 5 lignes : le problème, ta solution, le bénéfice estimé. Envoie-la à ton manager. Note si tu l''as fait.',
  'Laszlo Bock dans Work Rules : ''Les personnes qui progressent le plus vite dans une organisation ne sont pas celles qui font le mieux leur travail — ce sont celles qui font leur travail ET améliorent le système autour d''elles.'' Adam Grant ajoute : ''Les givers qui prennent des initiatives visibles sans en attendre de retour immédiat sont perçus comme 40 % plus compétents que leurs pairs équivalents.''',
  'ratio_choisi', 'Ratio tâches choisies après initiative', 'L''initiative proposée change-t-elle ton sentiment d''autonomie ?', true, 2, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Négocie 1 tâche — délègue, supprime ou recadre',
  '10 min', 'Reconfiguration',
  'Dans ta liste de tâches récurrentes, identifie la plus drainante et la moins stratégique. Est-ce qu''elle peut être déléguée ? Supprimée sans conséquence réelle ? Recadrée pour y trouver plus de sens ? Note ce que tu vas faire.',
  'Adam Grant dans Think Again : ''Beaucoup de tâches existent par inertie, pas par nécessité. La question — est-ce que cette tâche existerait si on redessinait le poste aujourd''hui ? — révèle souvent qu''entre 20 et 40 % des activités récurrentes pourraient disparaître sans impact mesurable.'' Laszlo Bock : ''Chez Google, on encourage explicitement les employés à remettre en question leurs propres descriptions de poste.''',
  'ratio_choisi', 'Ratio tâches choisies après négociation', 'As-tu récupéré de l''autonomie ?', true, 2, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Demande du feedback direct à 2 collègues — méthode précise',
  'Variable', 'Feedback',
  'Contacte 2 personnes qui t''observent régulièrement au travail. Pose-leur exactement cette question : ''Quelle est la chose que je pourrais changer qui aurait le plus d''impact positif sur notre collaboration ?'' Une seule question. Note leurs réponses mot pour mot.',
  'Laszlo Bock (Work Rules) : ''Le feedback continu et spécifique est le levier de développement le plus puissant qui existe — et le moins utilisé. La plupart des gens attendent l''évaluation annuelle pour avoir un retour structuré, soit 11 mois de retard.'' Adam Grant : ''Les personnes qui demandent activement du feedback à leurs pairs progressent 2× plus vite que celles qui attendent.''',
  'competences', 'Compétences en développement identifiées', 'Nombre de pistes de développement issues du feedback', true, 2, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Mesure l''impact d''une semaine de deep work sur ton énergie',
  '1 min', 'Comparaison',
  'Après avoir protégé tes créneaux de focus cette semaine, note ton énergie pro sur 10. Compare à ta baseline du niveau 0. Quel est le delta ? Qu''est-ce qui a changé concrètement ?',
  'Laszlo Bock cite une étude interne Google : ''Les employés qui protègent régulièrement du temps de travail profond rapportent une satisfaction au travail 28 % supérieure et un niveau de stress 19 % inférieur — sans aucun changement de rôle, de salaire ou de manager.'' La corrélation entre concentration profonde et énergie perçue est l''une des plus robustes dans la recherche organisationnelle.',
  'energie_pro', 'Énergie pro après 1 semaine de deep work', 'Compare à ta baseline du niveau 0', true, 2, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 3
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Définis ta compétence signature — celle sur laquelle tu veux être reconnu dans 3 ans',
  '10 min', 'Positionnement',
  'Si dans 3 ans on parlait de toi dans ton secteur, pour quelle compétence précise voudrais-tu être reconnu ? Pas un titre — une capacité rare et observable. Note-la en 1 phrase.',
  'Cal Newport dans So Good They Can''t Ignore You : ''La passion suit la maîtrise, elle ne la précède pas. Les personnes qui développent une compétence signature irremplaçable finissent toujours par aimer ce qu''elles font — parce que la maîtrise génère de l''autonomie, de la reconnaissance et du sens.'' Laszlo Bock : ''Les 5 % de talents les plus demandés chez Google ont une compétence distinctive claire que tout le monde dans l''organisation peut nommer.''',
  'competences', 'Compétences en développement actif', 'Nombre de compétences avec un plan de développement', true, 3, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Plan de développement 90 jours — 1 compétence, 1 action par semaine',
  '15 min', 'Planification',
  'Choisis la compétence prioritaire à développer ce trimestre. Pour chacune des 12 prochaines semaines : quelle est l''action concrète de 30 à 60 minutes qui fera progresser cette compétence ? Note les 4 premières semaines maintenant.',
  'Laszlo Bock (Work Rules) : ''Chez Google, les employés qui ont un plan de développement écrit avec des jalons hebdomadaires progressent 2,3× plus vite que ceux qui ont des objectifs annuels flous.'' Adam Grant : ''La pratique délibérée — travailler précisément sur ses points de faiblesse avec un feedback immédiat — est le seul mécanisme prouvé de progression rapide dans une compétence.''',
  'competences', 'Semaines de plan de développement construites', 'Nombre de semaines avec une action définie', true, 3, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Identifie et contacte 1 mentor potentiel dans les 7 prochains jours',
  '10 min', 'Réseau',
  'Qui, dans ton réseau ou ton secteur, a 5 à 10 ans d''avance sur la trajectoire que tu veux prendre ? Identifie 1 personne précise. Rédige un message de 5 lignes pour demander 30 minutes d''échange. Envoie-le.',
  'Adam Grant dans Give and Take : ''Le mentorat informel — une conversation de 30 minutes avec quelqu''un qui a fait le chemin — est statistiquement le facteur le plus corrélé à la progression de carrière, devant les formations, les diplômes et les réseaux institutionnels.'' Laszlo Bock : ''Chez Google, 100 % des employés qui progressent rapidement ont un mentor interne ou externe actif. Ce n''est pas une coïncidence — c''est une pratique.''',
  NULL, NULL, NULL, false, 3, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Négocie quelque chose cette année — salaire, périmètre ou conditions',
  '20 min', 'Négociation',
  'Quel est l''élément de ta rémunération ou de tes conditions de travail qui mériterait d''être renégocié ? Prépare en 20 minutes : ta demande précise, 3 arguments basés sur ta valeur ajoutée, et la date à laquelle tu vas lancer la conversation.',
  'Laszlo Bock dans Work Rules : ''Les gens qui ne négocient pas laissent en moyenne 500 000 € sur la table sur l''ensemble de leur carrière — uniquement parce qu''ils n''ont pas demandé.'' Adam Grant : ''Les négociateurs les plus efficaces ne sont pas les plus agressifs — ce sont ceux qui préparent le mieux leur cas et qui demandent précisément.'' Ne pas demander est une certitude de ne pas obtenir.',
  'revenu_pro', 'Revenu mensuel cible après négociation', 'Le montant que tu vises dans la prochaine négociation', true, 3, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Mesure ton revenu mensuel actualisé — et identifie l''écart au marché',
  '10 min', 'Benchmark',
  'Reprends ton revenu mensuel du niveau 0. Compare-le à 3 offres d''emploi similaires au tien sur LinkedIn ou Welcome to the Jungle. Quel est l''écart en pourcentage ? Es-tu sous, dans ou au-dessus du marché ?',
  'Laszlo Bock : ''La transparence salariale — savoir ce que le marché paie pour ce qu''on fait — est le prérequis de toute négociation efficace. Les salariés qui connaissent leur valeur marché sont 3× plus susceptibles de la négocier.'' Adam Grant : ''L''information asymétrique profite toujours à celui qui en sait plus. Dans une négociation salariale, c''est presque toujours l''employeur — jusqu''à ce que tu fasses ta recherche.''',
  'revenu_pro', 'Ton revenu mensuel vs marché', 'Ton revenu actuel — est-il dans/sous/au-dessus du marché ?', true, 3, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 4
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Bilan trimestriel — compare tes 5 métriques au départ',
  '15 min', 'Bilan complet',
  'Reprends chaque métrique du niveau 0 : énergie pro, ratio choisi/subi, compétences développées, stress, revenu. Calcule le delta exact pour chacune. Quelle est ta plus grande progression ? Quelle métrique résiste le plus ?',
  'Laszlo Bock appelle ça ''People Analytics'' appliqué à soi-même. ''Les décisions de carrière les plus coûteuses sont celles prises sur des données subjectives. Le bilan chiffré trimestriel est le seul outil qui permet de décider avec des faits.'' Adam Grant : ''Se remettre en question sur sa propre progression n''est pas une faiblesse — c''est la pratique des scientifiques appliquée à la carrière.''',
  'energie_pro', 'Énergie pro bilan trimestriel', 'Compare à ta baseline du niveau 0', true, 4, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Identifie les croyances professionnelles à remettre en question',
  '10 min', 'Rethinking',
  'Adam Grant demande à ses étudiants : ''Quelle est la croyance sur votre carrière que vous n''avez jamais vraiment remise en question ?'' Note 3 croyances que tu as sur ton travail, ton secteur ou tes capacités — puis pour chacune, demande-toi : quelle preuve contraire existe-t-il ?',
  'Adam Grant dans Think Again : ''Les professionnels les plus efficaces pensent comme des scientifiques — ils forment des hypothèses sur leur carrière et cherchent activement des preuves contraires. Les moins efficaces pensent comme des avocats — ils défendent leurs croyances existantes contre toute remise en question.'' Ce défi est le plus difficile du parcours — et souvent le plus transformateur.',
  NULL, NULL, NULL, false, 4, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Écris la description de ton poste idéal dans 3 ans — en chiffres',
  '10 min', 'Vision',
  'Dans 3 ans : intitulé de poste, secteur, taille d''équipe, niveau de responsabilité, rémunération cible, ratio tâches choisies visé, compétences utilisées. En chiffres et faits — pas en sentiments. Note ce qui est réaliste vs ce qui est ambitieux.',
  'Laszlo Bock : ''Les employés qui ont une vision écrite de leur poste dans 3 ans prennent des décisions hebdomadaires 3× mieux alignées avec leurs objectifs de long terme.'' Adam Grant : ''La précision de l''objectif prédit la qualité du chemin pour y arriver. Avoir un bon job et être directeur produit dans une scale-up B2B à 80K€ brut d''ici 3 ans génèrent des stratégies radicalement différentes.''',
  'revenu_pro', 'Revenu cible dans 3 ans (€/mois)', 'Le revenu que tu vises dans ta vision à 3 ans', true, 4, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'travail'),
  'Évalue le coût de l''inaction — combien te coûte de ne pas changer ?',
  '10 min', 'Décision',
  'Si dans 3 ans tu es exactement au même poste, avec les mêmes métriques qu''aujourd''hui — quel est le coût réel ? En euros (salaire non négocié, promotions manquées), en énergie (3 ans à ce niveau de stress), en compétences non développées. Chiffre chaque ligne.',
  'Adam Grant dans Think Again : ''Le biais du statu quo nous fait systématiquement sous-estimer le coût de l''inaction et surestimer le coût du changement. Mettre le statu quo en chiffres rééquilibre la décision.'' Laszlo Bock : ''La pire décision de carrière n''est presque jamais de changer trop tôt — c''est d''attendre trop longtemps par peur de l''inconfort à court terme.''',
  'energie_pro', 'Énergie pro — projection si statu quo maintenu', 'Sur 10 — où tu en serais dans 3 ans sans changer', true, 4, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;


-- ============================================================
-- DÉFIS — DOMAINE: entrepreneuriat
-- ============================================================

-- Niveau 0
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Depuis combien de temps cette idée tourne dans ta tête sans que tu agisses ?',
  '2 min', 'Prise de conscience',
  'Compte honnêtement — en mois ou en années. Note ce chiffre. C''est le temps déjà consacré à l''inaction. Il est parfait comme point de départ.',
  'Paul Graham : ''La plupart des fondateurs ratent parce qu''ils s''arrêtent, pas parce qu''ils échouent.'' Oussama Ammar va plus loin : ''Chaque mois que tu n''agis pas, quelqu''un d''autre teste ton idée. Il n''est pas plus intelligent que toi — il a juste commencé.'' Nommer le délai crée la tension nécessaire au passage à l''acte.',
  'objectifs_mois', 'Mois d''inaction sur cette idée', 'Compte honnêtement — en mois ou années', true, 0, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'En une phrase, sans te censurer : qu''est-ce qui te retient vraiment ?',
  '2 min', 'Diagnostic',
  'Pas une liste. Une phrase. La vraie raison — pas la version présentable.',
  'Il existe 4 freins principaux chez le salarié-entrepreneur : la peur du jugement des proches, la peur de l''échec financier, le syndrome de l''imposteur, et l''attente de ''conditions parfaites''. Chacun a une solution différente. On ne peut traiter que ce qu''on a nommé. Oussama Ammar : ''Ton cerveau est extraordinairement créatif pour trouver des raisons de ne pas commencer.''',
  NULL, NULL, NULL, false, 0, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Combien d''heures tu passes vraiment sur ton projet cette semaine ?',
  '2 min', 'Mesure baseline',
  'Pas l''idéal — la réalité. Compte les heures concrètes passées à construire, tester, écrire. Pas à lire des articles sur l''entrepreneuriat. Pas à écouter des podcasts. À construire.',
  'Eric Ries (Lean Startup) : ''La vitesse d''apprentissage est la seule métrique qui compte au début.'' Et elle est directement proportionnelle aux heures réelles de travail. La moyenne des salariés qui ''travaillent sur leur projet'' est de 45 minutes par semaine. Ce chiffre est le premier levier à déplacer.',
  'heures_projet', 'Heures réelles sur le projet cette semaine', 'Pas les podcasts ou articles — les heures à construire', true, 0, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Combien de livres ou podcasts as-tu consommés ce mois — et qu''as-tu appliqué ?',
  '3 min', 'Audit apprentissage',
  'Liste tout ce que tu as lu ou écouté ce mois. Maintenant : pour chaque ressource, qu''est-ce que tu as concrètement appliqué ? La réponse honnête révèle si tu accumules de la connaissance ou si tu avances.',
  'Il existe un piège documenté en psychologie cognitive appelé ''l''illusion de compétence par procuration'' — consommer du contenu entrepreneurial active les mêmes circuits cérébraux que l''action réelle, sans les risques. Paul Graham : ''Reading about startups is to starting one what reading about sex is to having it.'' La connaissance sans application est du confort déguisé en préparation.',
  'apprentissage', 'Ressources consommées ce mois', 'Et pour chacune : 1 chose appliquée concrètement ?', true, 0, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 1
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Identifie les 5 heures perdues dans ta semaine — sans les supprimer',
  '5 min', 'Audit temps',
  'Regarde ta semaine passée. Transports, temps d''attente, réseaux sociaux le soir, pauses lunch seul. Sans supprimer quoi que ce soit : identifie 5 heures qui pourraient être partiellement redirigées. Note-les précisément.',
  'Oussama Ammar : ''Tu n''as pas de problème de temps. Tu as un problème de priorités.'' Une étude de l''Université de Nottingham (2019) montre que les salariés qui lancent un side project réussi ne travaillent pas plus — ils réallouent en moyenne 4,2 heures hebdomadaires précédemment non structurées. Le temps est là. Il attend une décision.',
  'heures_projet', 'Heures projet potentiellement récupérables', 'Sans supprimer quoi que ce soit — juste réallouer', true, 1, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Calcule ton taux horaire personnel — et commence à déléguer en dessous',
  '10 min', 'Décision système',
  'Imagine que tu reçois un bon avec un montant dessus — mais il faut faire 1 heure de queue pour le récupérer. À partir de quel montant tu fais la queue ? C''est ton taux horaire personnel réel. Maintenant liste 3 tâches de ta semaine qui coûtent moins cher à déléguer qu''à faire toi-même : ménage, taxi, trajet, livraison. Calcule le gain de temps et le coût de délégation.',
  'Paul Graham écrit que les meilleurs fondateurs ont une obsession commune : ''Ils sont pathologiquement allergiques à passer du temps sur ce qui ne crée pas de valeur.'' Ce calcul est l''outil le plus simple pour concrétiser cette obsession. Exemple : si ton taux horaire est 40 €/h et qu''une aide ménagère coûte 15 €/h, chaque heure déléguée te rapporte 25 € nets en temps récupéré. Oussama Ammar : ''Ton temps sur ton projet vaut exactement ce que tu acceptes de payer pour le libérer.'' La même logique s''applique au transport — un taxi à 18 € qui te fait gagner 45 minutes quand ton taux est 40 €/h est une décision rentable, pas un luxe.',
  'taux_horaire', 'Ton taux horaire personnel (€/h)', 'Le montant à partir duquel tu fais la queue', true, 1, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Bloque 3 créneaux ''projet'' dans ton calendrier cette semaine',
  '3 min', 'Planification',
  'Ouvre ton calendrier maintenant. Bloque 3 créneaux de 45 minutes minimum, labellisés ''Projet''. Pas ''peut-être''. Pas ''si j''ai le temps''. Des créneaux fixes, aussi intouchables qu''une réunion avec ton directeur. Note le total d''heures bloquées.',
  'Paul Graham (Y Combinator) demande à tous ses fondateurs : ''À quelle heure de la journée écrivez-vous du code ?'' Si tu n''as pas de réponse, tu n''avances pas. La recherche sur la productivité créative (Newport, Deep Work) montre que les créneaux planifiés à l''avance produisent 3× plus de travail utile que les sessions improvisées.',
  'heures_projet', 'Heures projet bloquées cette semaine', 'Créneaux fixes dans le calendrier', true, 1, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Définis tes 3 objectifs pour ce mois — en 10 minutes',
  '10 min', 'Objectifs mensuels',
  '3 objectifs concrets et mesurables pour les 30 prochains jours sur ton projet. Pas des aspirations — des livrables. Exemple : ''Parler à 5 clients potentiels'', ''Créer une landing page'', ''Générer 100 € de revenus''. Note-les. À la fin du mois, tu reviendras les cocher.',
  'Eric Ries (Lean Startup) appelle ça les ''milestones de validation''. La différence entre un objectif qui avance et un qui stagne est presque toujours la présence ou l''absence d''un délai et d''un critère de succès mesurable. Les personnes qui écrivent leurs objectifs mensuels les atteignent 42 % plus souvent (Dominican University, Dr. Gail Matthews).',
  'objectifs_mois', 'Objectifs fixés ce mois', '3 objectifs concrets et mesurables pour les 30 prochains jours', true, 1, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Consomme 1 ressource directement liée à ton problème actuel',
  'Variable', 'Apprentissage ciblé',
  'Quel est ton problème le plus urgent cette semaine sur ton projet ? Cherche 1 livre, podcast ou article qui traite exactement ce problème — pas l''entrepreneuriat en général. Note ce que tu en retiens en 3 lignes.',
  'Paul Graham distingue deux types d''apprentissage entrepreneurial : l''apprentissage de confort (lire sur l''entrepreneuriat en général) et l''apprentissage de traction (apprendre ce dont tu as besoin maintenant pour avancer). Le second est 10× plus dense en valeur. Oussama Ammar : ''Le livre parfait à lire, c''est celui qui résout ton problème d''aujourd''hui.''',
  'apprentissage', 'Ressources appliquées ce mois', 'Ciblées sur ton problème actuel — pas l''entrepreneuriat en général', true, 1, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Lance ta première action de validation — même ridicule, même imparfaite',
  'Variable', 'Première action',
  'Quelle est la plus petite action possible qui pourrait te donner une information réelle sur ton idée ? Envoyer un message LinkedIn, poster dans un groupe Facebook, créer un formulaire Google et l''envoyer à 5 personnes. Fais-la. Maintenant. Note ce que tu as fait.',
  'Eric Ries : ''La seule façon de tester une hypothèse, c''est d''aller dans le monde réel.'' Paul Graham : ''Do things that don''t scale.'' Oussama Ammar : ''L''action imparfaite bat systématiquement le plan parfait non exécuté.'' La première action est psychologiquement la plus difficile et physiquement la plus simple.',
  'actions_val', 'Actions de validation lancées ce mois', 'Compte cette action', true, 1, 5
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 2
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Identifie 10 personnes précises qui ont ton problème cible',
  '10 min', 'Recherche client',
  'Pas ''les gens qui...'' — des noms. 10 personnes réelles dans ton réseau ou identifiables sur LinkedIn qui vivent le problème que ton projet résout. Note leurs noms et ce qui te fait penser qu''elles ont ce problème.',
  'Paul Graham (Y Combinator) interdit à ses fondateurs de parler de ''marché'' en termes abstraits avant d''avoir une liste de noms. ''Si tu ne peux pas nommer 10 personnes précises qui ont ce problème, tu n''as pas encore de problème — tu as une hypothèse.'' La liste de noms transforme le marché abstrait en personnes réelles.',
  'actions_val', 'Actions de validation lancées ce mois', 'Chaque personne identifiée = 1 action', true, 2, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Mène 3 conversations de découverte client cette semaine',
  'Variable', 'Interviews',
  'Contacte 3 personnes de ta liste. Pose-leur 5 questions sur leur problème — pas sur ta solution. Comment ils gèrent le problème aujourd''hui ? Combien ça leur coûte ? Qu''est-ce qu''ils ont déjà essayé ? Note les verbatims exacts.',
  'Eric Ries appelle ces conversations ''Customer Discovery''. La règle d''or : ''Parlez du problème, jamais de votre solution.'' Les fondateurs qui font moins de 20 interviews client avant de construire ont 3× plus de chances de construire quelque chose que personne ne veut (CB Insights, 2021). Oussama Ammar : ''Tes 3 premières conversations client valent plus que 3 mois de code.''',
  'actions_val', 'Conversations client menées ce mois', 'Compte ces 3 conversations', true, 2, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Teste le prix — demande à 5 personnes combien elles paieraient',
  '5 min', 'Validation prix',
  'Pour chaque personne que tu as interviewée, pose une question directe : ''Si ce problème était résolu demain, combien tu paierais par mois pour ça ?'' Note les réponses exactes — pas tes interprétations.',
  'Paul Graham : ''La réponse au prix est la donnée la plus honnête que tu recevras jamais.'' Les gens mentent sur beaucoup de choses en interview, mais le prix qu''ils citent spontanément est un signal de la douleur réelle. Eric Ries : si personne ne peut citer un prix sans sourciller, le problème n''est pas assez douloureux.',
  'revenus_side', 'Prix moyen cité par les personnes interrogées', 'Moyenne des prix spontanément cités', true, 2, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Construis ton MVP en 1 heure — la version la plus simple possible',
  '1h', 'Build',
  'Pas une application. Pas un site. La preuve que ton idée fonctionne avec les outils que tu as maintenant : un formulaire Google, un Google Doc partagé, un message WhatsApp, un tableau Notion public. Crée-le. Envoie-le à 3 personnes.',
  'Eric Ries définit le MVP comme ''la version du produit qui permet de collecter le maximum d''apprentissages validés avec le minimum d''effort.'' Paul Graham va plus loin : ''Votre premier produit sera embarrassant dans 3 ans. Lancez-le maintenant.'' Oussama Ammar : ''Le produit parfait livré trop tard ne vaut rien. Le produit imparfait livré aujourd''hui vaut tout.''',
  'actions_val', 'MVP construit et envoyé', '1 = MVP en ligne et partagé à 3 personnes', true, 2, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Fixe tes objectifs du mois prochain — en mesurant ceux du mois passé',
  '10 min', 'Revue mensuelle',
  'Reprends les 3 objectifs que tu as fixés au niveau 1. Combien en as-tu atteints ? Pour chacun non atteint : qu''est-ce qui s''est passé ? Fixe maintenant 3 nouveaux objectifs pour le mois suivant, plus précis.',
  'Le cycle mensuel objectifs → exécution → revue est la boucle d''apprentissage la plus rapide pour un salarié avec peu de temps. Eric Ries appelle ça ''Build-Measure-Learn'' à l''échelle personnelle. Les entrepreneurs qui font une revue mensuelle structurée progressent 2,5× plus vite que ceux qui avancent sans mesurer (Harvard Business Review, 2017).',
  'objectifs_mois', '% objectifs du mois dernier atteints', 'Objectifs atteints / objectifs fixés × 100', true, 2, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 3
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Crée ta première offre — en 30 minutes, sur une page',
  '30 min', 'Offre',
  'Rédige une offre simple : qui tu aides, quel problème tu résous, comment, à quel prix. Pas de site. Pas de logo. Un Google Doc ou une page Notion publique. Envoie-le à 3 personnes de ta liste.',
  'Paul Graham : ''Faites quelque chose que les gens veulent.'' La clé n''est pas la forme de l''offre — c''est la clarté. Seth Godin : ''Si tu ne peux pas décrire ton offre en une phrase que ta grand-mère comprend, l''offre n''est pas claire.'' L''offre imparfaite envoyée aujourd''hui bat l''offre parfaite prête dans 3 mois.',
  'revenus_side', 'Prix de ton offre (€)', 'Le prix de ta première offre formalisée', true, 3, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Envoie 10 messages de proposition directe cette semaine',
  'Variable', 'Prospection',
  '10 messages personnalisés — pas de copier-coller — à des personnes qui ont le problème que tu résous. Tu proposes ton aide, directement, clairement, avec un prix ou une proposition d''échange. Note combien de réponses tu obtiens.',
  'Eric Ries : ''La croissance vient de l''action, pas de la préparation.'' Paul Graham sur la prospection directe : ''Do things that don''t scale. Talk to people one by one. It works.'' La prospection directe a un taux de conversion moyen de 10-15 % chez les side projects en early stage — contre 0,5-2 % pour une landing page froide.',
  'actions_val', 'Messages de prospection envoyés ce mois', 'Compte ces 10 messages', true, 3, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Génère tes premiers revenus — même 10 €',
  'Variable', 'Premier revenu',
  'Quelle est la façon la plus rapide de générer 10 à 100 € avec ce que tu sais faire cette semaine ? Une consultation, un document vendu, une prestation ponctuelle. Note le montant exact généré.',
  'Oussama Ammar : ''Le premier euro est le plus difficile à gagner. Et il vaut psychologiquement plus que tous les suivants réunis.'' La recherche comportementale montre que générer un premier revenu externe, même symbolique, augmente de 340 % la probabilité de continuer le projet sur 6 mois (University of Chicago, 2018). L''argent n''est pas le but — c''est la preuve.',
  'revenus_side', 'Revenus secondaires ce mois (€)', 'Total exact des revenus générés en dehors de ton emploi', true, 3, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Consomme et applique 1 ressource sur la vente ou le marketing',
  'Variable', 'Apprentissage',
  'Lis ou écoute 1 ressource spécifiquement sur ''comment vendre sans être commercial'' ou ''comment acquérir ses premiers clients''. Applique une seule chose ce soir. Note laquelle.',
  'Paul Graham écrit dans ses essays : ''La vente est la compétence que les fondateurs techniques détestent le plus apprendre — et celle qui détermine le plus leur succès.'' Les fondateurs qui se forment activement à la vente dans leur première année génèrent en moyenne 4× plus de revenus que ceux qui laissent le produit ''se vendre seul''. La vente s''apprend comme le code.',
  'apprentissage', 'Ressources sur la vente appliquées ce mois', 'Nombre de ressources avec 1 chose appliquée concrètement', true, 3, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Mesure tes revenus du mois — et projette le mois prochain',
  '5 min', 'Revue financière',
  'Total exact de tes revenus secondaires ce mois. Quel est l''objectif pour le mois prochain ? Quelle est l''action principale qui va permettre de l''atteindre ?',
  'Eric Ries : ''La seule métrique qui compte, c''est celle qui mesure si tu avances vers la viabilité.'' Pour un side project, c''est le revenu mensuel. Pas les visiteurs, pas les likes, pas les abonnés — les euros. Oussama Ammar : ''Un business qui ne fait pas d''argent n''est pas un business. C''est un hobby avec des ambitions.''',
  'revenus_side', 'Revenus secondaires actualisés (€/mois)', 'Compare au mois précédent', true, 3, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 4
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Calcule ton taux horaire réel sur le projet',
  '5 min', 'Analyse financière',
  'Divise tes revenus du mois par le nombre d''heures passées sur le projet. Quel est ton taux horaire réel ? Compare à ton salaire horaire actuel. Quelle est la tendance sur les 3 derniers mois ?',
  'Oussama Ammar : ''Le side project devient une vraie option quand ton taux horaire externe dépasse ton salaire interne.'' Ce calcul simple révèle la vérité sur la viabilité financière d''une transition. Paul Graham recommande de ne jamais quitter son emploi avant que le revenu du side project couvre 6 mois de dépenses — pas avant.',
  'revenus_side', 'Taux horaire réel du projet (€/h)', 'Revenus / heures passées ce mois', true, 4, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Identifie le levier qui doublerait tes revenus ce trimestre',
  '10 min', 'Stratégie',
  'Parmi : augmenter les prix, trouver plus de clients, automatiser une tâche, lancer un nouveau produit, créer du contenu — quel est le levier qui aurait le plus d''impact sur tes revenus dans les 90 prochains jours ? Note pourquoi, et quelle est la première action cette semaine.',
  'Eric Ries : ''Dans un early stage, un seul levier domine. Trouver lequel est la décision stratégique la plus importante.'' La dispersion sur plusieurs leviers simultanément est la principale cause de stagnation chez les side projecteurs. Paul Graham appelle ça ''default alive'' vs ''default dead'' — la croissance est-elle assez forte pour que le projet survive ?',
  'actions_val', 'Actions stratégiques lancées ce mois', 'Sur le levier prioritaire identifié', true, 4, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Bilan trimestriel — compare tes 5 métriques au départ',
  '15 min', 'Bilan complet',
  'Reviens sur tes baselines. Pour chaque métrique : revenus/mois, heures/semaine, ressources appliquées, objectifs atteints, actions lancées. Calcule le delta exact. Quel est le chiffre dont tu es le plus fier ? Lequel résiste encore ?',
  'Le bilan trimestriel est la pratique qui différencie les entrepreneurs qui progressent de ceux qui tournent en rond. Eric Ries appelle ça ''Innovation Accounting'' — mesurer objectivement si les hypothèses sont validées ou non. Ce bilan n''est pas un jugement — c''est une carte pour les 90 jours suivants.',
  'objectifs_mois', '% objectifs trimestriels atteints', 'Objectifs atteints sur les 3 derniers mois', true, 4, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'entrepreneuriat'),
  'Dans 12 mois, ton projet est à quel stade ? Écris-le précisément',
  '10 min', 'Vision',
  'Dans 12 mois, si tout se passe aussi bien que possible : quel est le stade exact de ton projet ? Revenus mensuels, nombre de clients, nombre d''heures par semaine, décision sur ton emploi actuel. Écris-le en chiffres, pas en sentiments.',
  'Paul Graham : ''La vision sans chiffres est de la poésie. Avec des chiffres, c''est un plan.'' Les entrepreneurs qui formulent leur objectif 12 mois en termes précis et mesurables prennent des décisions hebdomadaires 3× mieux alignées avec leur cible. Oussama Ammar : ''La clarté sur la destination détermine la qualité de chaque décision quotidienne.''',
  'revenus_side', 'Objectif revenus dans 12 mois (€/mois)', 'Le chiffre que tu vises dans 1 an', true, 4, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;


-- ============================================================
-- DÉFIS — DOMAINE: bienetre
-- ============================================================

-- Niveau 0
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Quel est ton score de bien-être global cette semaine ?',
  '1 min', 'Mesure baseline',
  'Sur 10, ton niveau de bien-être global de cette semaine. Pas l''idéal — la réalité. Seligman définit le bien-être par 5 dimensions : émotions positives, engagement, relations, sens, accomplissement. En tenant compte des cinq, quel est ton chiffre honnête ?',
  'Martin Seligman (Flourish) : ''Le bien-être n''est pas simplement l''absence de souffrance — c''est la présence active de cinq éléments mesurables. Un score global de 6/10 ne signifie pas que tout va mal : il signifie qu''il y a 4 points de progression disponibles, et qu''ils sont atteignables méthodiquement.'' Ce chiffre devient ton point zéro — il est parfait, quel qu''il soit.',
  'bienetre_global', 'Ton score de bien-être global', 'Sur 10 — en tenant compte des 5 dimensions PERMA', true, 0, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Quel est ton niveau de stress moyen cette semaine — et d''où vient-il ?',
  '5 min', 'Mesure baseline',
  'Sur 10, ton niveau de stress moyen de cette semaine. Puis nomme sa source principale en une phrase précise — pas ''trop de travail'', mais quelque chose d''identifiable et de spécifique.',
  'Jon Kabat-Zinn (Full Catastrophe Living) : ''Le stress n''est pas ce qui t''arrive — c''est la relation que tu entretiens avec ce qui t''arrive.'' La première étape du programme MBSR n''est pas de réduire le stress — c''est de l''observer précisément. Nommer la source active le cortex préfrontal et réduit l''activation de l''amygdale de 23 % immédiatement (UCLA, 2007).',
  'stress_perso', 'Ton niveau de stress cette semaine', 'Sur 10 + source principale nommée en 1 phrase', true, 0, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Combien de pratiques de bien-être as-tu eues cette semaine — compte-les honnêtement',
  '3 min', 'Mesure baseline',
  'Une pratique de bien-être compte si elle était intentionnelle et d''au moins 5 minutes : méditation, respiration consciente, marche sans téléphone, journaling, gratitude, temps de qualité avec quelqu''un. Pas les activités qui font du bien par hasard — celles que tu as choisies délibérément.',
  'Martin Seligman distingue le hedonic well-being (plaisir passif, séries, confort) du eudaimonic well-being (bien-être actif, construit intentionnellement). Ses recherches montrent que ''les personnes qui ont au moins 3 pratiques intentionnelles de bien-être par semaine ont un score PERMA moyen 34 % supérieur à celles qui n''en ont aucune — indépendamment de leur situation objective.''',
  'pratiques', 'Pratiques intentionnelles cette semaine', 'Intentionnelles et d''au moins 5 minutes', true, 0, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Quand as-tu ressenti de la joie authentique pour la dernière fois ?',
  '5 min', 'Mesure baseline',
  'Pas du soulagement, pas du contentement, pas du plaisir — de la joie. Ce sentiment d''être pleinement vivant et présent. C''était quand, dans quel contexte, avec qui ou seul ? Sur 10, à quelle fréquence ressens-tu ce type de joie en ce moment ?',
  'Seligman dans PERMA : le P (Positive Emotions) ne se réduit pas au bonheur de surface. ''La joie authentique est un état d''épanouissement actif — pas l''absence de problèmes.'' Jon Kabat-Zinn ajoute : ''La pleine conscience ne crée pas la joie — elle crée les conditions pour la remarquer quand elle est là, et pour ne plus la laisser passer inaperçue.''',
  'joie', 'Score de joie authentique actuel', 'À quelle fréquence ressens-tu ce type de joie en ce moment, sur 10', true, 0, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Évalue la qualité de tes 3 relations les plus importantes',
  '5 min', 'Mesure baseline',
  'Identifie les 3 personnes avec qui tu interagis le plus régulièrement (famille, ami proche, collègue). Pour chacune : sur 10, la qualité de la relation — profondeur, authenticité, énergie mutuelle. Donne une moyenne.',
  'Le R de PERMA selon Seligman : ''Les relations profondes ne se maintiennent pas seules — elles nécessitent des investissements intentionnels réguliers.'' L''étude de Harvard sur le bonheur adulte (80 ans, 700+ participants) arrive à la même conclusion : ''La qualité des relations à 50 ans prédit mieux la santé physique à 80 ans que le cholestérol.''',
  'relations', 'Qualité moyenne de tes 3 relations principales', 'Profondeur, authenticité, énergie mutuelle — moyenne des 3 sur 10', true, 0, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 1
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  '5 minutes de respiration consciente — maintenant, pas ce soir',
  '5 min', 'Action immédiate',
  'Pose ton téléphone. Inspire 4 secondes, retiens 4 secondes, expire 6 secondes. Répète pendant 5 minutes. Note ton niveau de stress avant et après sur 10.',
  'Jon Kabat-Zinn : ''La respiration est le seul système autonome du corps qu''on peut contrôler consciemment — c''est la porte d''entrée la plus directe vers le système nerveux parasympathique.'' Le protocole 4-4-6 active la réponse de relaxation en moins de 90 secondes (Herbert Benson, Harvard Medical School). Pas de la théorie — de la physiologie.',
  'pratiques', 'Pratiques intentionnelles cette semaine', 'Compte cette séance de respiration', true, 1, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Identifie tes 3 sources de joie authentique — et quand tu les as eues pour la dernière fois',
  '5 min', 'Cartographie',
  'Quelles sont les 3 activités, contextes ou types de connexion qui te procurent de la joie authentique ? Pour chacune : la dernière fois que tu l''as vécue, c''était quand ?',
  'Seligman dans Authentic Happiness : ''Les gens qui connaissent précisément leurs sources de joie les vivent en moyenne 2,3× plus souvent que ceux qui les laissent arriver par hasard.'' Kabat-Zinn : ''La pleine conscience commence par savoir ce qui nous nourrit vraiment — pour pouvoir y revenir délibérément.''',
  'joie', 'Score de joie après identification des sources', 'A-t-il changé rien qu''en les nommant ?', true, 1, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Installe une pratique de gratitude — 3 choses spécifiques ce soir',
  '3 min', 'Pratique',
  'Ce soir avant de dormir : note 3 choses spécifiques et concrètes pour lesquelles tu es reconnaissant aujourd''hui. Pas ''ma santé'' ou ''ma famille'' — quelque chose de précis qui s''est passé aujourd''hui. Note ton score de bien-être avant et après.',
  'Martin Seligman a testé 5 exercices de psychologie positive en conditions contrôlées. La pratique de gratitude quotidienne est celle qui produit ''la hausse la plus significative et la plus durable du bien-être global — jusqu''à +0,8 points sur 10 en 4 semaines'' (Journal of Clinical Psychology, 2005). La spécificité est clé.',
  'pratiques', 'Pratiques intentionnelles cette semaine', 'Compte cette pratique de gratitude', true, 1, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Note tes émotions 3 fois par jour pendant 3 jours',
  '1 min × 3/j', 'Tracking',
  'Matin, midi, soir : note en 1 mot l''émotion principale que tu ressens. Pas une analyse — juste le mot. Au bout de 3 jours, quelle est la tendance ? Quelles émotions dominent ?',
  'Jon Kabat-Zinn appelle ça ''l''inventaire émotionnel'' — la première pratique du programme MBSR. ''On ne peut pas travailler avec ses émotions si on ne sait pas lesquelles on ressent. La plupart des gens vivent dans un brouillard émotionnel qu''ils appellent stress ou fatigue.'' Seligman confirme : identifier et nommer ses émotions positives et négatives augmente le ratio P/N de 18 % en moyenne après 3 semaines.',
  'bienetre_global', 'Score bien-être après 3 jours de tracking émotionnel', 'A-t-il changé avec la prise de conscience ?', true, 1, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Planifie 1 moment de joie intentionnelle cette semaine',
  '5 min', 'Planification',
  'Reprends ta liste de sources de joie authentique. Choisis-en une. Planifie-la dans ton agenda cette semaine — avec une date, une heure, une durée. Pas ''j''essaierai'' — un créneau bloqué. Note ton score de joie après l''avoir vécue.',
  'Seligman dans Flourish : ''Planifier ses moments positifs à l''avance n''enlève pas leur spontanéité — ça garantit qu''ils ont lieu.'' Les personnes qui planifient délibérément des expériences positives vivent en moyenne 40 % plus de moments de joie que celles qui attendent que ça arrive naturellement.',
  'joie', 'Score de joie après le moment planifié', 'Mesure après avoir vécu ce moment', true, 1, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 2
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Installe une méditation de 10 minutes — 7 jours de suite',
  '10 min/j × 7', 'Pratique régulière',
  'Pendant 7 jours, médite 10 minutes au même moment de la journée. Application (Petit Bambou, Headspace, Insight Timer) ou guidé sur YouTube. Coche chaque jour. Note ton score de stress en début et fin de semaine.',
  'Jon Kabat-Zinn a démontré que ''7 jours de pratique consécutive suffisent à créer une trace neurologique mesurable — une nouvelle habitude commence à s''encoder.'' Une méta-analyse de 47 études (JAMA Internal Medicine, 2014) confirme : 8 semaines de méditation régulière réduisent l''anxiété de 38 % et le score de stress perçu de 31 %. Tout commence par 7 jours.',
  'pratiques', 'Jours de méditation consécutifs cette semaine', 'Sur 7 — combien as-tu tenu ?', true, 2, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Identifie et réduis une source de stress chronique — concrètement',
  '15 min', 'Action',
  'Reprends la source de stress principale que tu as nommée au niveau 0. Quelle est la plus petite action concrète qui réduirait son impact de 20 % cette semaine — pas de l''éliminer, juste réduire ? Note l''action et mesure ton stress après.',
  'Kabat-Zinn : ''Le programme MBSR ne cherche pas à éliminer le stress — il cherche à modifier la relation qu''on entretient avec lui.'' Seligman complète avec une approche plus active : identifier les stresseurs modifiables et agir sur 1 seul à la fois. ''Vouloir tout régler d''un coup produit exactement le stress qu''on cherche à réduire.''',
  'stress_perso', 'Stress après action sur la source principale', 'Le même score — a-t-il bougé ?', true, 2, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Améliore 1 relation — une conversation en profondeur',
  'Variable', 'Relations',
  'Choisis une relation de ta liste — celle qui a le plus de potentiel non exprimé. Programme une conversation d''1 heure sans téléphone, sans agenda, juste pour être ensemble. Note ton score de qualité de cette relation avant et après.',
  'Le R de PERMA selon Seligman : ''Les relations profondes ne se maintiennent pas seules — elles nécessitent des investissements intentionnels réguliers.'' Brené Brown ajoute que la profondeur d''une relation est directement proportionnelle au niveau de vulnérabilité partagée. Une conversation sans agenda est l''acte d''investissement relationnel le plus simple et le plus puissant.',
  'relations', 'Qualité de cette relation après la conversation', 'Sur 10 — compare à avant', true, 2, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Pratique le body scan — 15 minutes, une fois cette semaine',
  '15 min', 'Pratique corps',
  'Le body scan de Kabat-Zinn : allonge-toi, ferme les yeux, parcours mentalement chaque partie de ton corps de bas en haut pendant 15 minutes sans chercher à changer quoi que ce soit — juste observer. Note ce que tu remarques.',
  'Jon Kabat-Zinn a développé le body scan comme pratique fondatrice du MBSR pour une raison précise : ''La plupart des gens vivent dans leur tête et ignorent leur corps jusqu''à ce qu''il proteste. Le body scan reconstruit la connexion corps-esprit qui est la base de tout bien-être durable.'' Des études IRM montrent une réduction de la rumination de 27 % après une session.',
  'pratiques', 'Pratiques intentionnelles cette semaine', 'Compte cette session de body scan', true, 2, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Mesure ton évolution — compare tes 5 métriques à ta baseline',
  '5 min', 'Comparaison',
  'Reprends tes 5 scores du niveau 0. Remesuré-les aujourd''hui avec la même honnêteté. Calcule le delta pour chacun. Quelle est ta plus grande progression ? Quelle métrique résiste encore ?',
  'Seligman dans Flourish : ''Mesurer sa progression est en soi une intervention de bien-être. Voir des données objectives d''amélioration active le circuit de la récompense et renforce la motivation à continuer — c''est ce que la psychologie positive appelle l''effet de momentum positif.''',
  'bienetre_global', 'Score bien-être global actualisé', 'Compare à ta baseline du niveau 0', true, 2, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 3
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Cartographie tes 5 piliers PERMA — où en es-tu sur chacun ?',
  '15 min', 'Évaluation PERMA',
  'Note chaque pilier PERMA de 1 à 10 : P = émotions positives (joie, gratitude, sérénité), E = engagement/flow, R = relations de qualité, M = sens (ta vie compte), A = accomplissement (progression vers des objectifs). Quel est ton pilier le plus fort ? Le plus faible ?',
  'Seligman a développé le PERMA après 20 ans de recherches comme ''la carte la plus complète du bien-être humain durable''. Chaque pilier est indépendant — on peut avoir un score M (sens) de 9 et un score R (relations) de 4. ''La cartographie PERMA révèle en 15 minutes ce que des années d''introspection floue ne produisent pas : un diagnostic précis avec des leviers d''action identifiés.''',
  'bienetre_global', 'Score PERMA global', 'Moyenne des 5 piliers P+E+R+M+A / 5', true, 3, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Identifie ton pilier PERMA le plus faible — et une action cette semaine',
  '10 min', 'Action ciblée',
  'Reprends le pilier où tu as le score le plus bas. Quelle est la plus petite action concrète qui ferait monter ce score de 1 point cette semaine ? Une seule. Note-la et fais-la.',
  'Seligman : ''Les interventions les plus efficaces en psychologie positive ne travaillent pas sur les forces — elles renforcent les piliers déficitaires. Un point de progression sur un pilier à 3 produit plus de bien-être global qu''un point de progression sur un pilier déjà à 8.'' C''est la loi des rendements décroissants appliquée au bien-être.',
  'pratiques', 'Pratiques ciblées sur ton pilier faible cette semaine', 'Nombre de pratiques dédiées au pilier déficitaire', true, 3, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Pratique la pleine conscience dans une activité quotidienne — 7 jours',
  'Variable', 'Mindfulness intégré',
  'Choisis une activité quotidienne (repas, douche, trajet, vaisselle). Pendant 7 jours, fais-la en pleine conscience : tous tes sens présents, sans téléphone, sans pensées parallèles. Juste cette activité. Note ce que tu remarques.',
  'Kabat-Zinn appelle ça ''informal mindfulness practice'' — la pratique intégrée dans le quotidien. ''La pleine conscience n''est pas ce qu''on fait sur son coussin de méditation — c''est la qualité d''attention qu''on apporte à chaque moment de sa vie.'' Ces pratiques informelles produisent les mêmes bénéfices neurologiques que la méditation formelle, mesurés en IRM fonctionnelle.',
  'pratiques', 'Jours de mindfulness intégré dans une activité quotidienne', 'Sur 7 — combien as-tu tenu ?', true, 3, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Le sens — pourquoi ce que tu fais compte au-delà de toi',
  '15 min', 'Sens profond',
  'Le M de PERMA (Meaning) : en dehors de toi, à qui ou à quoi ta vie contribue-t-elle ? Ta famille, tes proches, ton équipe, une cause, une communauté ? Écris 5 lignes sur le sens que tu donnes à ta vie en ce moment — sans te censurer.',
  'Seligman : ''Le sens est le pilier PERMA le plus prédictif du bien-être à long terme — et le moins travaillé. Les gens passent plus de temps à optimiser leur productivité qu''à clarifier pourquoi ils sont productifs.'' Viktor Frankl : ''Celui qui a un pourquoi peut supporter n''importe quel comment.'' La clarté du sens est un bouclier contre l''épuisement.',
  NULL, NULL, NULL, false, 3, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Évalue et nourris ta relation la plus précieuse',
  'Variable', 'Relation prioritaire',
  'Quelle est la relation la plus importante de ta vie en ce moment ? Sur 10, sa qualité réelle — pas idéalisée. Quelle est la chose non dite, le temps non accordé, l''attention non donnée qui réduirait cet écart si tu agissais dessus cette semaine ?',
  'Seligman cite l''étude Grant de Harvard : ''La qualité de notre relation la plus importante à 50 ans est le meilleur prédicteur connu de notre santé et bonheur à 80 ans — devant le statut social, la richesse et la santé à 50 ans.'' Ce n''est pas une métaphore — c''est 80 ans de données longitudinales.',
  'relations', 'Qualité de ta relation prioritaire', 'Sur 10 — après l''avoir nourrie intentionnellement', true, 3, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 4
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Bilan trimestriel — compare tes 5 métriques PERMA au départ',
  '15 min', 'Bilan complet',
  'Reprends tes 5 métriques du niveau 0 : bien-être global, stress, pratiques/semaine, joie authentique, qualité des relations. Remesuré-les avec la même honnêteté. Calcule le delta exact pour chacune. Quel est le chiffre dont tu es le plus fier ?',
  'Seligman : ''Le bilan trimestriel de bien-être est l''acte de self-care le plus négligé et le plus rentable. Il transforme 90 jours d''efforts diffus en données claires — et ces données sont presque toujours meilleures que ce que la perception quotidienne suggère.''',
  'bienetre_global', 'Score bien-être global bilan trimestriel', 'Compare à ta baseline du niveau 0', true, 4, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Conçois ton rituel de bien-être personnel — 5 pratiques, 5 jours par semaine',
  '20 min', 'Design système',
  'Conçois ton rituel hebdomadaire de bien-être idéal-réaliste : 5 pratiques que tu peux tenir 5 jours par semaine, chacune entre 5 et 20 minutes. Note lesquelles, quand, et combien de minutes par jour au total.',
  'Kabat-Zinn : ''Un rituel de bien-être qui tient n''est pas celui qui est parfait sur le papier — c''est celui qui est assez simple pour survivre à ta pire semaine.'' Seligman confirme avec ses données : les personnes qui ont un rituel de bien-être structuré ont un score PERMA moyen 41 % supérieur sur 12 mois. La structure crée la liberté.',
  'pratiques', 'Pratiques dans ton rituel hebdomadaire', 'Nombre de pratiques dans ton rituel conçu', true, 4, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Identifie et exprime une vulnérabilité à quelqu''un de confiance',
  'Variable', 'Connexion profonde',
  'Quelle est une chose vraie sur toi — une peur, une incertitude, quelque chose qui te pèse — que tu n''as jamais dite à voix haute à quelqu''un de confiance ? Choisis la personne. Dis-le. Note ton score de qualité de cette relation avant et après.',
  'Seligman dans PERMA : ''Les relations les plus nourrissantes sont celles où les deux personnes se sont montrées telles qu''elles sont — pas telles qu''elles voudraient paraître.'' La recherche sur la connexion sociale (University of Virginia, 2019) montre qu''exprimer une vulnérabilité authentique augmente la confiance perçue de 34 % et la profondeur relationnelle de 41 %.',
  'relations', 'Qualité de cette relation après la vulnérabilité partagée', 'Sur 10 — compare à avant', true, 4, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'bienetre'),
  'Écris ta vision de vie épanouie dans 5 ans — les 5 piliers PERMA',
  '20 min', 'Vision',
  'Dans 5 ans, si tu t''épanouissais pleinement sur les 5 piliers PERMA — à quoi ressemble ta vie ? P : quelles émotions positives dominent ? E : dans quoi es-tu engagé profondément ? R : quelles relations nourrissent ta vie ? M : à quoi contribues-tu ? A : qu''as-tu accompli ? Écris chaque pilier en 3 lignes concrètes.',
  'Seligman : ''La vision n''est pas un exercice de pensée positive — c''est un outil de navigation. Les personnes qui ont une vision claire de leur bien-être futur prennent des décisions quotidiennes 3× mieux alignées avec leur épanouissement.'' Kabat-Zinn : ''La pleine conscience du moment présent et la vision du futur ne s''opposent pas — l''une ancre dans le réel, l''autre donne la direction.''',
  'joie', 'Score de joie en imaginant ta vie dans 5 ans', 'Sur 10 — ce que tu ressens en écrivant cette vision', true, 4, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;


-- ============================================================
-- DÉFIS — DOMAINE: ecologie
-- ============================================================

-- Niveau 0
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Calcule ton empreinte carbone annuelle — ton chiffre réel',
  '5 min', 'Mesure baseline',
  'Va sur nosgestesclimats.fr (outil de l''ADEME, gratuit, 5 minutes). Complète le questionnaire honnêtement. Note ton empreinte totale en tonnes CO²/an et les 3 postes qui représentent le plus gros pourcentage.',
  'Johan Rockström a défini l''objectif planétaire : 2 tonnes CO² par personne et par an pour rester sous 1,5°C de réchauffement. La moyenne française est 9,2 tonnes. Bon Pote : ''La bonne nouvelle, c''est que 80 % de l''empreinte se concentre sur 4 postes — transport, alimentation, logement, achats. Connaître ses 3 premiers postes, c''est déjà savoir où agir.''',
  'carbone', 'Ton empreinte carbone annuelle', 'En tonnes CO² par an — via nosgestesclimats.fr', true, 0, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Combien dépenses-tu en transport carboné ce mois — en euros exacts',
  '5 min', 'Mesure baseline',
  'Ouvre tes relevés bancaires. Additionne toutes les dépenses de transport qui émettent du CO² ce mois : carburant, autoroutes, billets d''avion divisés par 12, location de voiture, VTC. Note le total en euros.',
  'Bon Pote avec les données françaises : ''Le transport représente en moyenne 29 % de l''empreinte carbone d''un Français — et l''avion en est la composante la plus explosive. Un aller-retour Paris-New York émet autant que 10 mois de chauffage au gaz.'' La conversion euros → CO² est directe : chaque euro de carburant correspond à environ 2,3 kg de CO² émis.',
  'transport_co2', 'Dépenses transport carboné ce mois', 'Carburant + autoroutes + avion/12 + VTC en euros', true, 0, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Quelle est ta consommation électrique mensuelle réelle',
  '3 min', 'Mesure baseline',
  'Regarde ta dernière facture EDF ou ton espace client en ligne. Note ta consommation en kWh ce mois. Si tu n''as pas accès, estime à partir de ta facture annuelle divisée par 12.',
  'Johan Rockström sur l''électricité française : ''La France a la chance d''avoir une électricité parmi les moins carbonées d''Europe grâce au nucléaire — 60g CO²/kWh contre 400g en Allemagne. Mais réduire sa consommation reste pertinent : pour la sobriété, pour la facture, et parce que la décarbonation complète du mix n''est pas encore acquise.'' La consommation moyenne française est 350 kWh/mois par foyer.',
  'electricite', 'Ta consommation électrique mensuelle', 'En kWh — sur ta dernière facture ou espace client', true, 0, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Combien de repas as-tu jetés cette semaine — compte honnêtement',
  '3 min', 'Mesure baseline',
  'Pense à ta semaine. Combien de repas préparés ou d''aliments achetés ont fini à la poubelle sans être consommés ? Un yaourt périmé, des restes jetés, un repas commandé non terminé — tout compte.',
  'Cyril Dion dans Demain : ''Le gaspillage alimentaire représente 8 % des émissions mondiales de gaz à effet de serre — si la nourriture gaspillée était un pays, ce serait le 3e émetteur mondial.'' Bon Pote précise : ''En France, chaque habitant gaspille en moyenne 30 kg de nourriture par an. Et 60 % de ce gaspillage se passe à la maison — pas dans les supermarchés ou les restaurants.''',
  'gaspillage', 'Repas jetés cette semaine', 'Repas préparés ou aliments achetés et non consommés', true, 0, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 1
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Calcule l''empreinte CO² de tes 3 principaux postes',
  '10 min', 'Analyse',
  'Reprends les 3 postes identifiés au niveau 0. Pour chacun, cherche l''ordre de grandeur CO² sur nosgestesclimats.fr ou Bon Pote. Note le % que chaque poste représente dans ton empreinte totale. Quel est le poste sur lequel une action de 20 % aurait le plus d''impact absolu ?',
  'Johan Rockström : ''80 % de l''impact climatique individuel se concentre sur 3 à 4 postes. Optimiser les 20 % restants en ignorant les 80 % principaux est une erreur classique.'' Bon Pote appelle ça ''l''effet paille'' : se féliciter d''avoir arrêté les pailles en plastique (0,003 % de l''empreinte) pendant qu''on prend 2 avions par an (40 % de l''empreinte).',
  'carbone', 'Empreinte des 3 postes principaux (t CO²/an)', 'Somme des 3 postes identifiés au niveau 0', true, 1, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Identifie tes achats du mois — neuf vs seconde main',
  '5 min', 'Audit',
  'Liste tous tes achats non-alimentaires de ce mois. Pour chacun : neuf ou seconde main ? Calcule le ratio. Qu''est-ce que tu as acheté neuf qui existait probablement d''occasion ?',
  'Cyril Dion dans Demain : ''La seconde main n''est pas un sacrifice — c''est souvent moins cher, plus original, et elle coupe la chaîne de production à la source.'' Bon Pote avec les chiffres : ''Acheter un jean neuf émet environ 33 kg de CO² — l''acheter d''occasion émet 0,5 kg. La fabrication d''un smartphone émet 80 % de ses émissions totales avant même qu''il soit allumé.''',
  'seconde_main', '% de tes achats non-alimentaires en seconde main', 'Achats occasion / total achats non-alimentaires × 100', true, 1, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Mesure ton gaspillage alimentaire sur 7 jours',
  '30 sec/j × 7', 'Tracking',
  'Pendant 7 jours, note chaque soir ce que tu as jeté comme nourriture. Pas pour te culpabiliser — pour voir le pattern. À la fin des 7 jours : quel type d''aliment revient le plus souvent ? Quel moment de la semaine concentre le plus de gaspillage ?',
  'Cyril Dion : ''Les solutions au gaspillage alimentaire ne demandent pas de sacrifice — elles demandent de l''organisation. Les familles qui font un plan repas hebdomadaire réduisent leur gaspillage de 40 % en moyenne dès la première semaine.'' Le pattern révélé par 7 jours de tracking est toujours plus précis que l''intuition.',
  'gaspillage', 'Gaspillage alimentaire moyen cette semaine', 'Repas jetés en moyenne par jour', true, 1, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Compare ton empreinte transport à l''objectif 2 tonnes',
  '5 min', 'Mise en perspective',
  'Ton poste transport représente combien de tonnes CO² par an ? (Utilise le calculateur nosgestesclimats.fr pour le transport uniquement.) Si l''objectif global est 2 tonnes par an, combien ton transport seul en consomme-t-il ? Quel est le delta ?',
  'Johan Rockström : ''L''objectif de 2 tonnes par personne et par an inclut tous les postes — transport, alimentation, logement, achats, services publics. Un seul aller-retour Paris-Bangkok consomme à lui seul 3,5 tonnes CO² — soit 175 % du budget annuel total compatible avec 1,5°C.'' Ces chiffres ne sont pas là pour culpabiliser — ils sont là pour prioriser rationnellement.',
  'transport_co2', 'Dépenses transport carboné actualisées (€/mois)', 'Après prise de conscience de l''impact réel', true, 1, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Identifie 3 substitutions concrètes dans tes achats courants',
  '10 min', 'Substitution',
  'Parmi tes achats réguliers (vêtements, électronique, livres, sport, décoration), identifie 3 catégories où la seconde main est facilement accessible. Pour chacune : quelle plateforme tu vas utiliser (Vinted, Leboncoin, Back Market, Momox) ? Note tes 3 substitutions.',
  'Cyril Dion : ''La transition écologique ne ressemble pas à un sacrifice — elle ressemble à une transformation des habitudes d''achat, souvent accompagnée d''économies significatives.'' Bon Pote confirme : ''Acheter 50 % de ses vêtements en seconde main réduit l''empreinte mode de 44 %. Et en France, Vinted et Leboncoin rendent cette substitution aussi pratique que l''achat neuf.''',
  'seconde_main', '% achats seconde main ce mois', 'Après avoir identifié les 3 substitutions', true, 1, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 2
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Remplace 1 trajet voiture par semaine — pendant 4 semaines',
  'Variable', 'Action transport',
  'Identifie le trajet en voiture le plus facilement remplaçable de ta semaine. Vélo, transport en commun, covoiturage, ou simplement marche. Pendant 4 semaines, remplace ce trajet systématiquement. Note tes dépenses transport ce mois.',
  'Bon Pote avec les ordres de grandeur : ''Passer d''une voiture thermique à des transports en commun pour les trajets domicile-travail réduit l''empreinte transport de 2,4 tonnes CO² par an en moyenne.'' Cyril Dion : ''Dans Demain, on a documenté des villes où 70 % des déplacements se font à vélo — pas parce que les gens sont vertueux, mais parce que l''infrastructure le rend évident.''',
  'transport_co2', 'Dépenses transport carboné ce mois', 'A-t-il baissé avec ce remplacement ?', true, 2, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Plan repas de la semaine — objectif zéro gaspillage',
  '15 min', 'Organisation',
  'Avant de faire tes courses cette semaine : planifie 5 dîners et 5 déjeuners en tenant compte de ce que tu as déjà dans le frigo. Fais une liste de courses précise. À la fin de la semaine, note combien de repas tu as jetés.',
  'Cyril Dion : ''Le plan repas est l''intervention la plus simple, la plus rapide et la plus efficace contre le gaspillage alimentaire — et elle fait économiser en moyenne 30 € par semaine pour une famille de 4.'' Bon Pote : ''Réduire son gaspillage alimentaire à zéro représente une réduction d''empreinte de 0,3 tonne CO² par an — autant qu''une année sans prendre l''avion pour un court-courrier.''',
  'gaspillage', 'Repas jetés cette semaine avec plan repas', 'Compare à ta baseline — la différence ?', true, 2, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Réduis ta consommation électrique — les 5 gestes à fort impact',
  '10 min', 'Action logement',
  'Parmi ces 5 actions, combien appliques-tu déjà ? Chauffage à 19°C maximum, eau chaude à 55°C, extinction complète des veilles, lave-linge à 30°C, éclairage LED partout. Pour chaque action non encore appliquée : installe-la aujourd''hui. Note ta consommation ce mois vs le mois dernier.',
  'Johan Rockström sur la sobriété énergétique : ''Les comportements de sobriété individuelle peuvent réduire la consommation résidentielle de 15 à 30 % sans investissement — juste avec des changements d''usage.'' Bon Pote précise : ''En France, le chauffage représente 66 % de la consommation énergétique d''un logement. Baisser le thermostat de 1°C réduit la facture de 7 % et l''empreinte de 0,3 tonne CO² par an.''',
  'electricite', 'Consommation électrique ce mois', 'Compare à ta baseline — combien économisé ?', true, 2, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Ton premier achat seconde main — cette semaine',
  'Variable', 'Action achat',
  'Identifie un achat que tu prévois de faire dans les 30 prochains jours. Cherche-le d''abord en seconde main (Vinted, Leboncoin, Back Market, La Redoute Seconde Main). Si tu le trouves : achète-le d''occasion. Note le prix payé vs le prix neuf et les kg CO² économisés.',
  'Cyril Dion : ''Chaque achat d''occasion est un vote pour un modèle économique différent — et une économie immédiate pour son portefeuille.'' Bon Pote avec les chiffres concrets : ''Acheter un smartphone reconditionné plutôt que neuf économise en moyenne 70 kg de CO² et 150 € — pour le même appareil.''',
  'seconde_main', '% achats seconde main ce mois', 'Avec cet achat d''occasion compté', true, 2, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Compare ton empreinte actuelle à ta baseline du niveau 0',
  '5 min', 'Comparaison',
  'Refais une estimation rapide de ton empreinte avec tes nouvelles habitudes. Quel est le delta vs ta baseline ? Quel poste a le plus bougé ? Quelle est la distance restante vers l''objectif de 2 tonnes ?',
  'Johan Rockström : ''La réduction de 7,2 tonnes (de 9,2 à 2) semble énorme. Mais elle se décompose en étapes : chaque tonne réduite compte, et les premières tonnes sont les plus faciles à réduire — ce sont les gestes les plus accessibles qui ont aussi le plus d''impact.'' Voir la progression chiffrée est le meilleur moteur pour continuer.',
  'carbone', 'Empreinte carbone actualisée', 'Nouvelle estimation avec tes nouvelles habitudes', true, 2, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 3
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Mesure ta réduction transport sur 3 mois — le delta en euros et en CO²',
  '5 min', 'Bilan transport',
  'Compare tes dépenses transport de ce mois vs ta baseline du niveau 0. Calcule le delta en euros et estime la réduction en CO² (1 litre d''essence = 2,4 kg CO², 1 km en avion = 0,25 kg CO²). Quel est le poste qui a le plus bougé ?',
  'Bon Pote : ''La réduction du transport carboné est le levier individuel à plus fort impact — et souvent le plus rentable financièrement. Supprimer un aller-retour Paris-Marseille en avion et le faire en train économise 0,18 tonne CO² et souvent 150 € en billet.''',
  'transport_co2', 'Dépenses transport carboné — delta vs baseline', 'Ce mois vs ta baseline — économies en € et CO²', true, 3, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Installe un système anti-gaspillage permanent dans ton frigo',
  '15 min', 'Organisation',
  'Applique la règle FIFO dans ton frigo (First In, First Out — les aliments les plus anciens devant). Installe une liste de courses récurrente pour les basiques. Prends une photo de ton frigo avant les courses. Note ton gaspillage cette semaine vs ta baseline.',
  'Cyril Dion : ''Les solutions au gaspillage alimentaire les plus durables sont celles qui s''intègrent dans les systèmes existants — pas celles qui demandent une discipline extraordinaire.'' Bon Pote : ''La règle FIFO réduit le gaspillage alimentaire de 25 % en moyenne sans aucun effort quotidien — juste une organisation initiale de 15 minutes.''',
  'gaspillage', 'Repas jetés cette semaine avec système FIFO', 'Compare à ta baseline — la différence ?', true, 3, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Fais un audit de tes appareils en veille',
  '15 min', 'Sobriété numérique',
  'Liste tous les appareils en veille chez toi (box internet, TV, console, chargeurs…). Mesure ou estime leur consommation en veille. Installe une multiprise avec interrupteur sur les plus consommateurs. Note ta consommation ce mois.',
  'Johan Rockström sur la sobriété numérique : ''Le numérique représente 4 % des émissions mondiales — en croissance de 6 % par an. En France, les appareils en veille représentent 11 % de la consommation électrique résidentielle — soit une facture annuelle de 130 € en pure perte.'' Bon Pote : ''Une multiprise avec interrupteur à 15 € peut économiser 80 kWh par an et se rembourse en 2 mois.''',
  'electricite', 'Consommation électrique après suppression des veilles', 'Compare à ta baseline', true, 3, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Intègre 2 repas végétariens supplémentaires par semaine',
  'Variable', 'Alimentation',
  'Identifie 2 repas de la semaine où remplacer la viande est le plus facile pour toi. Trouve 2 recettes simples qui te plaisent vraiment — pas des recettes vertueuses que tu n''auras pas envie de refaire. Note ton impact estimé.',
  'Bon Pote avec les ordres de grandeur : ''Passer d''une alimentation carnée à flexitarienne (réduction de 50 % de la viande) réduit l''empreinte alimentaire de 0,5 tonne CO² par an — l''équivalent de 3 allers-retours Paris-Lyon en voiture.'' Cyril Dion : ''Dans les pays qui ont le mieux réussi la transition alimentaire, ce n''est pas la contrainte qui a fonctionné — c''est la gastronomie.''',
  'carbone', 'Empreinte carbone actualisée avec repas végé', 'Nouvelle estimation avec l''impact alimentaire réduit', true, 3, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Bilan 3 mois — compare tes 5 métriques à la baseline',
  '10 min', 'Bilan complet',
  'Reprends chaque métrique du niveau 0 : empreinte CO², transport carboné, consommation électrique, ratio seconde main, gaspillage alimentaire. Calcule le delta exact. Quelle est ta réduction d''empreinte estimée en tonnes CO² ?',
  'Johan Rockström : ''Chaque tonne de CO² non émise compte — pas de façon symbolique, de façon physique et mesurable. Le système climatique est non-linéaire : les actions d''aujourd''hui ont un impact amplifié sur les décennies à venir.'' Cyril Dion : ''Voir ses données progresser sur 3 mois est souvent le moment où les gens passent de j''essaie d''être écolo à je suis quelqu''un qui agit pour le climat. L''identité suit les données.''',
  'carbone', 'Empreinte carbone bilan trimestriel', 'Ta réduction totale en tonnes CO² depuis le début', true, 3, 4
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

-- Niveau 4
INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Calcule ta distance à l''objectif 2 tonnes — plan d''action précis',
  '15 min', 'Stratégie',
  'Ton empreinte actuelle moins 2 tonnes = l''écart restant. Pour chaque tonne restante à réduire : quel est le levier le plus accessible dans ta situation ? Construis un plan sur 12 mois — 1 action par trimestre sur le poste à plus fort impact.',
  'Johan Rockström : ''L''objectif de 2 tonnes n''est pas une contrainte morale — c''est une contrainte physique. Le budget carbone mondial compatible avec 1,5°C de réchauffement, divisé par 8 milliards d''humains, donne exactement 2 tonnes par personne.'' Bon Pote : ''La bonne nouvelle : les actions à fort impact (transport aérien, voiture, alimentation carnée) sont aussi celles qui libèrent le plus d''argent quand on les réduit.''',
  'carbone', 'Empreinte carbone cible dans 12 mois', 'Si tu appliques ton plan — où tu arrives ?', true, 4, 0
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Mesure l''impact de tes habitudes sur ta facture annuelle',
  '10 min', 'Impact financier',
  'Calcule les économies financières générées par tes nouvelles habitudes sur 12 mois : transport réduit, gaspillage alimentaire évité, achats seconde main, électricité économisée. Quel est le total annuel économisé ?',
  'Bon Pote : ''La sobriété écologique est souvent présentée comme un sacrifice financier. C''est l''inverse : réduire sa consommation de viande économise en moyenne 600 €/an, supprimer un vol court-courrier économise 200 €, passer au vélo pour les trajets courts économise 1 200 €/an en carburant et assurance.'' Cyril Dion : ''Dans Demain, toutes les transitions documentées qui ont duré ont eu un bénéfice économique net.''',
  'transport_co2', 'Économies annuelles générées par tes nouvelles habitudes', 'Transport + gaspillage + seconde main + électricité en €/an', true, 4, 1
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Élargis ton impact — 1 action collective ce mois',
  'Variable', 'Impact collectif',
  'Quelle est une action collective accessible dans ton environnement direct ? Partager tes habitudes alimentaires avec un ami, proposer un système de covoiturage dans ton immeuble ou ton entreprise, rejoindre un AMAP local, voter pour une initiative écologique dans ta commune. Note ce que tu as fait.',
  'Cyril Dion : ''Le film Demain a montré que les transitions les plus rapides partent toujours d''individus qui entraînent leur cercle proche — pas d''injonctions gouvernementales.'' Johan Rockström confirme avec les données : ''La recherche sur les normes sociales montre que l''adoption d''un comportement écologique par un individu dans un réseau augmente de 25 % la probabilité que ses contacts directs l''adoptent aussi.''',
  NULL, NULL, NULL, false, 4, 2
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

INSERT INTO challenges (domain_id, title, duration, type, question, science_text, metric_key, metric_label, metric_sub, is_measure, level_index, order_index)
VALUES (
  (SELECT id FROM domains WHERE slug = 'ecologie'),
  'Bilan trimestriel complet — et vision sur 12 mois',
  '15 min', 'Bilan final',
  'Reprends tes 5 métriques. Calcule ta réduction d''empreinte totale depuis le début. Si tu maintenais ce rythme sur 12 mois, à quelle empreinte arriverais-tu ? Quelle est la distance restante à l''objectif 2 tonnes ? Quel est le prochain levier sur lequel agir ?',
  'Johan Rockström : ''La trajectoire compte autant que le niveau. Une empreinte de 6 tonnes en baisse régulière de 1 tonne par an est plus prometteuse qu''une empreinte de 4 tonnes stagnante.'' Bon Pote : ''L''action climatique individuelle a une limite réelle — environ 30 % de l''empreinte totale. Les 70 % restants dépendent des systèmes collectifs. Mais ces 30 % sont le meilleur signal qu''on envoie aux entreprises et aux élus sur ce qu''on est prêt à choisir.''',
  'carbone', 'Empreinte carbone — bilan trimestriel final', 'Ta réduction totale et ta trajectoire sur 12 mois', true, 4, 3
) ON CONFLICT (domain_id, level_index, order_index) DO UPDATE SET
  title = EXCLUDED.title, duration = EXCLUDED.duration, type = EXCLUDED.type,
  question = EXCLUDED.question, science_text = EXCLUDED.science_text,
  metric_key = EXCLUDED.metric_key, metric_label = EXCLUDED.metric_label,
  metric_sub = EXCLUDED.metric_sub, is_measure = EXCLUDED.is_measure;

COMMIT;

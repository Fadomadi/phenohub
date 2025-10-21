INSERT INTO "Cultivar" ("name", "slug", "cloneOnly", "cutInfo", "updatedAt")
VALUES
  ('Cyberskunk2077', 'cyberskunk2077', TRUE, 'Clone Only', CURRENT_TIMESTAMP),
  ('Papaya Punch', 'papaya-punch', TRUE, 'US Clone', CURRENT_TIMESTAMP),
  ('Forbidden Fruit', 'forbidden-fruit', FALSE, NULL, CURRENT_TIMESTAMP),
  ('Zombie Kush', 'zombie-kush', TRUE, 'Purple Pheno', CURRENT_TIMESTAMP),
  ('Super Lemon Haze', 'super-lemon-haze', TRUE, 'Franco''s Cut', CURRENT_TIMESTAMP),
  ('Blockberry', 'blockberry', FALSE, NULL, CURRENT_TIMESTAMP),
  ('Glitterbomb', 'glitterbomb', FALSE, NULL, CURRENT_TIMESTAMP),
  ('Oreoz', 'oreoz', FALSE, NULL, CURRENT_TIMESTAMP),
  ('RS11', 'rs11', FALSE, NULL, CURRENT_TIMESTAMP),
  ('Apple Jax', 'apple-jax', FALSE, NULL, CURRENT_TIMESTAMP),
  ('Super Boof Cherry #26', 'super-boof-cherry-26', FALSE, NULL, CURRENT_TIMESTAMP),
  ('Dantes Inferno #8', 'dantes-inferno-8', TRUE, 'Mile High Dave Cut', CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "cloneOnly" = EXCLUDED."cloneOnly",
  "cutInfo" = EXCLUDED."cutInfo",
  "updatedAt" = CURRENT_TIMESTAMP;

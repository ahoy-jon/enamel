# Subscription Service — TypeScript, PostgreSQL, Docker

Un exemple exécutable d'un service inspectable par Enamel. Il rend visibles le
contrat HTTP, les transitions d'état, les dépendances et les preuves associées
à ses invariants.

## Démarrer

```sh
docker compose up --build
```

L'API est exposée sur `http://localhost:3000`, PostgreSQL sur `5432` et NATS sur
`4222`. Les migrations sont exécutées lors de l'initialisation du conteneur
PostgreSQL. Pour le développement local :

```sh
npm install
npm run check
npm run dev
```

## Projection CUE du schéma

La vérification de schéma confronte deux projections indépendantes :

- `npm run schema:program` lit le contrat de persistance et les états de domaine
  du programme, puis écrit `enamel/program-schema.gen.cue` ;
- `DATABASE_URL=postgres://… npm run schema:database` interroge le catalogue
  PostgreSQL et écrit `enamel/database-schema.gen.cue`.

`enamel/schema.cue` les unifie. Ainsi, une colonne ou contrainte exigée par le
programme doit exister dans la base observée et les valeurs de
`subscription_status` doivent correspondre exactement. Toute table observée
dans le schéma PostgreSQL `public`, y compris une table non décrite par le
programme, doit aussi avoir une colonne `created_at`. Les contraintes et
colonnes supplémentaires restent autorisées ; les valeurs d'enum inconnues ne
le sont pas. Pour exécuter l'ensemble :

```sh
DATABASE_URL=postgres://app:app@localhost:5432/subscriptions npm run schema:check
```

La commande exporte explicitement `schema` après unification. Les projections
observées sont fermées : une colonne requise mais absente ne peut donc pas être
ajoutée virtuellement par CUE et fait échouer la commande.

Cette projection ne déduit ni types SQL, ni nullabilité, ni index, ni sémantique
des requêtes : elle couvre seulement les colonnes, enums et contraintes que le
contrat du programme expose aujourd'hui, ainsi que la convention structurelle
`created_at` sur les tables observées.

Les preuves d'intégration sont automatisées avec Testcontainers : le test crée
un PostgreSQL vierge, applique la migration, puis détruit le conteneur à la fin.
Il n'y a pas de base locale à préparer ni de `docker compose up` à lancer :

```sh
npm run test:integration
```

`npm run evidence` exécute les tests unitaires puis cette preuve PostgreSQL.
Testcontainers nécessite toujours un daemon Docker fonctionnel ; le problème
actuel de version API Docker doit donc être résolu avant d'exécuter ce test.
Docker Compose reste disponible uniquement pour explorer l'API et le worker
NATS manuellement.

Créer un abonnement :

```sh
curl -X POST localhost:3000/subscriptions \
  -H 'content-type: application/json' \
  -H 'idempotency-key: create-subscription-42' \
  -d '{"customerId":"cus_42","planId":"pro"}'
```

## Contrat et frontière Enamel

| Artefact | Rôle |
| --- | --- |
| `openapi.yaml` | Contrat HTTP observable. |
| `enamel/service.cue` | Spécification, dépendances, SLO, invariants et preuves possédées par l'humain. |
| `enamel/schema.cue` | Règle CUE qui unifie le schéma demandé par le programme et celui observé dans PostgreSQL, et impose `created_at` à chaque table observée. |
| `enamel/*-schema.gen.cue` | Projections CUE générées du contrat du programme et du catalogue PostgreSQL. |
| `tools/extract-program-schema.mjs` / `tools/dump-database-schema.mjs` | Adaptateurs de ces deux projections indépendantes. |
| `src/infrastructure/observe-postgres.ts` | Adaptateur qui observe les tables, enum et contraintes réellement migrées. |
| `src/enamel/database-contract.ts` | Règles entre les états du domaine et la persistance observée. |
| `src/domain/subscription.ts` | Machine à états : `ACTIVE → PAST_DUE → EXPIRED` ou `ACTIVE → CANCELLED`. |
| `migrations/001_initial.sql` | Contraintes persistées, dont l'unicité d'une tentative par période de facturation. |
| `tests/` | Preuves exécutables des règles métier. |

### Invariants appliqués

1. **Pas de double débit.** La clé primaire `(subscription_id, billing_period)`
   dans `renewal_attempts` est l'autorité concurrente ; `ON CONFLICT DO NOTHING`
   rend une seconde réservation inopérante.
2. **Création idempotente.** La clé `Idempotency-Key` est sérialisée par un
   verrou transactionnel PostgreSQL et sa réponse est mémorisée.
3. **Accès pendant le délai de grâce.** Le dernier échec de paiement fait passer
   l'abonnement à `PAST_DUE` avec une échéance de grâce à J+7. Dans un système
   réel, l'adaptateur de paiement n'appelle cette opération qu'après ses trois
   tentatives configurées.
4. **Événements fiables.** Chaque changement écrit un événement dans l'outbox.
   Le worker le publie sur NATS et le marque publié dans la même transaction de
   lecture/verrouillage.

L'outbox garantit au moins une fois : les consommateurs NATS doivent donc eux
aussi être idempotents. Elle ne prétend pas fournir un exactly-once global.

### Règles entre code et base de données

Le test Testcontainers n'exécute pas seulement des requêtes métier. Après avoir
appliqué la migration, l'adaptateur `observePostgres` lit le catalogue
PostgreSQL. Le contrat vérifie alors que :

- les valeurs de l'enum `subscription_status` correspondent exactement aux
  états runtime de `src/domain/subscription.ts` ;
- les colonnes persistées attendues existent ;
- les clés primaires et la clé étrangère qui garantissent idempotence et
  intégrité référentielle sont réellement présentes.

Lors de `npm run schema:check`, CUE applique en plus une règle de structure à
toutes les tables du schéma `public` : chacune doit posséder `created_at`.
Une migration qui ajoute une table sans cette colonne échoue donc même si le
code applicatif ne l'utilise pas encore.

Par exemple, ajouter `REFUND_PENDING` au domaine sans migration PostgreSQL fait
échouer `npm run test:integration`. À l'inverse, une migration qui retire la
contrainte d'unicité d'une période de facturation échoue aussi. L'observation
reste volontairement limitée : elle ne prouve ni les performances SQL, ni RLS,
ni le comportement de NATS.

## Changement guidé : `PAST_DUE`

L'ajout de l'état `PAST_DUE` affecte la machine à états, la persistance,
l'événement `subscription.past_due`, le contrat HTTP et les tests. Le fichier
`enamel/service.cue` rend cette surface et les preuves attendues inspectables
avant d'accepter le changement.

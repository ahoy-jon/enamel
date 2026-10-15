package subscription

// Unification checks that the database currently observed through PostgreSQL's
// catalog satisfies the schema the program relies on. The program projection is
// intentionally open: it need not describe unrelated database additions.
// Enum values are closed by programSchema because an unknown persisted status
// cannot safely be represented by the domain model.

// Every table observed in PostgreSQL's public schema must carry a creation
// timestamp. The pattern applies to fields discovered by the database
// adapter, including tables the program projection does not otherwise name.
#TablesHaveCreatedAt: {
	tables: [string]: {
		columns: {
			created_at: true
			...
		}
		...
	}
	...
}

schema: programSchema & databaseSchema & #TablesHaveCreatedAt

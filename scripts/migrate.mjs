import postgres from "postgres";

const sql = postgres({
  host: "db.ztvdunqatxygkjwqvzxb.supabase.co",
  port: 5432,
  database: "postgres",
  username: "postgres",
  password: "K?dfzUuq%@d2*zA",
  ssl: "require",
});

async function migrate() {
  console.log("Creating tables...");

  await sql`
    CREATE TABLE IF NOT EXISTS devedores (
      id SERIAL PRIMARY KEY,
      dt_inclusao TEXT DEFAULT '',
      nome TEXT NOT NULL,
      produto TEXT DEFAULT '',
      celular TEXT DEFAULT '',
      pagamento TEXT DEFAULT '',
      valor_total TEXT DEFAULT '',
      em_atraso TEXT DEFAULT '',
      parc_atraso TEXT DEFAULT '',
      parc_vencer TEXT DEFAULT '',
      dt_parcela TEXT DEFAULT '',
      cliente_ativo TEXT DEFAULT 'Verificar',
      acordo TEXT DEFAULT 'Nao',
      acesso TEXT DEFAULT 'Verificar',
      serasa TEXT DEFAULT 'Nao',
      protesto TEXT DEFAULT 'Nao',
      juridico TEXT DEFAULT 'Nao',
      status_wa TEXT DEFAULT 'Entrar em contato',
      dt_contato TEXT DEFAULT '',
      valor_recebido TEXT DEFAULT 'R$ 0,00',
      dt_recebido TEXT DEFAULT '',
      ult_alteracao TEXT DEFAULT '',
      observacao TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  ✓ devedores");

  // Add dt_recebido column if it doesn't exist yet (for existing databases)
  try {
    await sql`ALTER TABLE devedores ADD COLUMN IF NOT EXISTS dt_recebido TEXT DEFAULT ''`;
    console.log("  ✓ devedores.dt_recebido (alter)");
  } catch (e) {
    if (e.message?.includes("already exists")) {
      console.log("  ~ devedores.dt_recebido (already exists)");
    } else {
      throw e;
    }
  }

  await sql`
    CREATE TABLE IF NOT EXISTS audit_trail (
      id SERIAL PRIMARY KEY,
      devedor_id INTEGER REFERENCES devedores(id) ON DELETE CASCADE,
      ts TEXT NOT NULL,
      field TEXT NOT NULL,
      old_value TEXT DEFAULT '',
      new_value TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log("  ✓ audit_trail");

  // Enable RLS
  await sql`ALTER TABLE devedores ENABLE ROW LEVEL SECURITY`;
  await sql`ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY`;

  // Create policies (allow all for authenticated users)
  const policies = [
    { table: "devedores", name: "devedores_select", op: "SELECT" },
    { table: "devedores", name: "devedores_insert", op: "INSERT" },
    { table: "devedores", name: "devedores_update", op: "UPDATE" },
    { table: "devedores", name: "devedores_delete", op: "DELETE" },
    { table: "audit_trail", name: "audit_select", op: "SELECT" },
    { table: "audit_trail", name: "audit_insert", op: "INSERT" },
  ];

  for (const p of policies) {
    try {
      if (p.op === "INSERT") {
        await sql.unsafe(`CREATE POLICY ${p.name} ON ${p.table} FOR INSERT TO authenticated WITH CHECK (true)`);
      } else {
        await sql.unsafe(`CREATE POLICY ${p.name} ON ${p.table} FOR ${p.op} TO authenticated USING (true)`);
      }
      console.log(`  ✓ policy ${p.name}`);
    } catch (e) {
      if (e.message?.includes("already exists")) {
        console.log(`  ~ policy ${p.name} (already exists)`);
      } else {
        throw e;
      }
    }
  }

  // Also allow anon for now (simpler setup, can restrict later)
  for (const p of policies) {
    try {
      if (p.op === "INSERT") {
        await sql.unsafe(`CREATE POLICY ${p.name}_anon ON ${p.table} FOR INSERT TO anon WITH CHECK (true)`);
      } else {
        await sql.unsafe(`CREATE POLICY ${p.name}_anon ON ${p.table} FOR ${p.op} TO anon USING (true)`);
      }
      console.log(`  ✓ policy ${p.name}_anon`);
    } catch (e) {
      if (e.message?.includes("already exists")) {
        console.log(`  ~ policy ${p.name}_anon (already exists)`);
      } else {
        throw e;
      }
    }
  }

  console.log("\nDone! Tables created successfully.");
  await sql.end();
}

migrate().catch((e) => { console.error("Error:", e.message); process.exit(1); });

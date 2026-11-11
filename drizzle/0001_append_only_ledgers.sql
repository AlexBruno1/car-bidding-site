-- Bids, bid voids and the audit log are ledgers: rows can be added, never
-- changed or removed. Enforced here so that no application bug, script or
-- admin tool can rewrite auction history. Violations raise SQLSTATE AP001.
CREATE FUNCTION reject_ledger_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Table "%" is append-only: % is not allowed', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'AP001';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER bids_append_only BEFORE UPDATE OR DELETE ON "bids"
  FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
--> statement-breakpoint
CREATE TRIGGER bid_voids_append_only BEFORE UPDATE OR DELETE ON "bid_voids"
  FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_log_append_only BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
--> statement-breakpoint
CREATE TRIGGER bids_no_truncate BEFORE TRUNCATE ON "bids"
  FOR EACH STATEMENT EXECUTE FUNCTION reject_ledger_mutation();
--> statement-breakpoint
CREATE TRIGGER bid_voids_no_truncate BEFORE TRUNCATE ON "bid_voids"
  FOR EACH STATEMENT EXECUTE FUNCTION reject_ledger_mutation();
--> statement-breakpoint
CREATE TRIGGER audit_log_no_truncate BEFORE TRUNCATE ON "audit_log"
  FOR EACH STATEMENT EXECUTE FUNCTION reject_ledger_mutation();

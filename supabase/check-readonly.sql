-- Диагностика: почему база отвечает «read-only transaction»
select
  current_user                              as текущая_роль,
  pg_is_in_recovery()                       as это_реплика,
  current_setting('default_transaction_read_only') as транзакции_только_чтение,
  pg_size_pretty(pg_database_size(current_database())) as размер_базы;

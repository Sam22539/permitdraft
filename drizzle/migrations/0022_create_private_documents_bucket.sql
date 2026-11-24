insert into storage.buckets (id, name, public, file_size_limit) values ('company-documents','company-documents', false, 10485760) on conflict (id) do nothing;

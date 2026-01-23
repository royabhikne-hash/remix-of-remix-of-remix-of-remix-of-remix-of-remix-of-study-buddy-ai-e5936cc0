-- Make student-photos bucket public for viewing photos
UPDATE storage.buckets SET public = true WHERE id = 'student-photos';

-- Create policy for public read access to student photos
CREATE POLICY "Public read access to student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

-- Policy for students to upload their own photos
CREATE POLICY "Students can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'student-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for students to update their own photos
CREATE POLICY "Students can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'student-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for students to delete their own photos
CREATE POLICY "Students can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'student-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
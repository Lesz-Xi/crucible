-- Add scientific_analysis column to causal_chat_messages table for persisting scientific data
ALTER TABLE "causal_chat_messages" 
ADD COLUMN IF NOT EXISTS "scientific_analysis" JSONB;

COMMENT ON COLUMN "causal_chat_messages"."scientific_analysis" IS 'Stores the structured scientific analysis data from the synthesis engine';

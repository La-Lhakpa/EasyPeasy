import React from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const SavePhraseButton = ({ phraseText, contextSentence }) => {
  const handleSavePhrase = async () => {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error('You must be logged in to save phrases.');
      return;
    }

    // Check for duplicate before inserting
    const { data: existingPhrases, error: selectError } = await supabase
      .from('phrases')
      .select('id')
      .eq('user_id', user.id)
      .eq('phrase_text', phraseText);

    if (selectError) {
      console.error('Error checking for existing phrase:', selectError.message);
      toast.error('Error checking for existing phrase.');
      return;
    }

    if (existingPhrases && existingPhrases.length > 0) {
      toast.info('This phrase is already in your phrase bank!');
      return;
    }

    const { error } = await supabase.from('phrases').insert({
      user_id: user.id,
      phrase_text: phraseText,
      context_sentence: contextSentence,
    });

    if (error) {
      console.error('Error saving phrase:', error.message);
      toast.error('Failed to save phrase.');
    } else {
      toast.success('Phrase saved successfully!');
    }
  };

  return (
    <button onClick={handleSavePhrase} className="save-phrase-button">
      Save Phrase
    </button>
  );
};

export default SavePhraseButton;
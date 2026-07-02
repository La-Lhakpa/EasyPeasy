import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { useAuth } from '../lib/auth';

const PhraseBank = () => {
  const { user } = useAuth();
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPhrases = async () => {
      if (!supabase) {
        toast.error('Supabase is not configured.');
        setLoading(false);
        return;
      }

      if (!user) {
        setPhrases([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("phrases")
        .select("*")
        .eq("user_id", user.id);

      if (fetchError) {
        console.error('Error fetching phrases:', fetchError.message);
        setError('Failed to fetch phrases.');
        toast.error('Failed to fetch phrases.');
      } else {
        setPhrases(data || []);
      }
      setLoading(false);
    };

    fetchPhrases();
  }, [user]);

  const handleDeletePhrase = async (id) => {
    if (!supabase) {
      toast.error('Supabase is not configured.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to delete phrases.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this phrase?')) {
      const { error: deleteError } = await supabase
        .from('phrases')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own phrases

      if (deleteError) {
        console.error('Error deleting phrase:', deleteError.message);
        toast.error('Failed to delete phrase.');
      } else {
        toast.success('Phrase deleted successfully!');
        setPhrases(phrases.filter((phrase) => phrase.id !== id));
      }
    }
  };

  const handleSpeakPhrase = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // or based on user preference
      window.speechSynthesis.speak(utterance);
    } else {
      toast.warn('Text-to-speech is not supported in this browser.');
    }
  };

  if (loading) {
    return <div className="phrase-bank-loading">Loading phrases...</div>;
  }

  if (error) {
    return <div className="phrase-bank-error">Error: {error}</div>;
  }

  if (!user) {
    return (
      <div className="phrase-bank-not-logged-in">
        Please log in to view your phrase bank.
      </div>
    );
  }

  return (
    <div className="phrase-bank-container">
      <h2>My Phrase Bank</h2>
      {phrases.length === 0 ? (
        <p>No phrases saved yet. Start cooking and save some important words!</p>
      ) : (
        <ul className="phrase-list">
          {phrases.map((phrase) => (
            <li key={phrase.id} className="phrase-item">
              <p className="phrase-text"><strong>Phrase:</strong> {phrase.phrase_text}</p>
              <p className="context-sentence"><strong>Context:</strong> {phrase.context_sentence}</p>
              <div className="phrase-actions">
                <button onClick={() => handleSpeakPhrase(phrase.phrase_text)} className="speak-button">
                  Speak
                </button>
                <button onClick={() => handleDeletePhrase(phrase.id)} className="delete-button">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PhraseBank;
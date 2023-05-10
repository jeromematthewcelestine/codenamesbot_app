import polars as pl
import numpy as np
# from nltk.corpus import wordnet as wn
from itertools import combinations
from random import sample
import psycopg2

def load_codenames_words():
    with open('data/codenames_words.txt', 'r') as f:
        codenames_words = [word.strip().lower() for word in f.readlines()]
    
    codenames_words.remove('ice cream')
    codenames_words.remove('loch ness')
    codenames_words.remove('new york')
    codenames_words.remove('scuba diver')

    return codenames_words

class CodenamesClueGiver:
    def __init__(self):
        self.code_words = load_codenames_words()

        try:
            self.conn = psycopg2.connect(
                database="codewords_app",
                user="jeromew",
                password="sclub8",
                host="localhost",
                port="5432"
            )
        except:
            print("I am unable to connect to the database")
    
    def __del__(self):
        self.conn.close()

    def generate_best_clue(self, game_id, table_words, target_words, trap_words, previous_clues=None):

        if len(target_words) == 1:
            curr_target_words = target_words
            clue, score = self.generate_clue_for_specific_target_words(game_id, table_words, target_words, trap_words, previous_clues)
            best_target_words = curr_target_words
            
        if len(target_words) >= 2:
            best_score_2 = -10000
            for curr_target_words in combinations(target_words, 2):
                clue_2, score_2 = self.generate_clue_for_specific_target_words(game_id, table_words, curr_target_words, trap_words, previous_clues)
                if score_2 > best_score_2:
                    best_score_2 = score_2
                    best_clue_2 = clue_2
                    best_target_words_2 = curr_target_words

            clue = best_clue_2
            score = best_score_2
            best_target_words = best_target_words_2

        if len(target_words) >= 3:
            best_score_3 = -10000
            combos_3 = list(combinations(target_words, 3))
            if len(combos_3) > 20:
                combos_3 = sample(combos_3, 20)
            for curr_target_words in combos_3:
                clue_3, score_3 = self.generate_clue_for_specific_target_words(game_id, table_words, curr_target_words, trap_words, previous_clues)
                if score_3 > best_score_3:
                    best_score_3 = score_3
                    best_clue_3 = clue_3
                    best_target_words_3 = curr_target_words

            if best_score_3 > 0.8 * best_score_2:
                clue = best_clue_3
                score = best_score_3
                best_target_words = best_target_words_3

        return clue, score, best_target_words


    def generate_clue_for_specific_target_words(self, game_id, table_words, target_words, trap_words, previous_clues = None):
        clues = self.query_database(game_id, table_words, target_words, previous_clues)

        clue = clues[0][0]
        score_diff = clues[0][9]
        
        return clue, score_diff

    
    def query_database(self, game_id, table_words, target_words, previous_clues = None):
        print('querying database...')

        if previous_clues :
            placeholders= ', '.join(f"'{clue}'" for clue in previous_clues)
            previous_clues_param = 'WHERE word2 NOT IN (%s)' % placeholders
        else:
            previous_clues_param = ''

        try:
            # Connect to the PostgreSQL database
                
            # Open a cursor to perform database operations
            cur = self.conn.cursor()

            # Execute the SQL query with the word list as a parameter
            temp_table_query = f"""
                CREATE TEMPORARY TABLE IF NOT EXISTS temp_${game_id} AS (
                    SELECT * FROM pmi_v0_2 WHERE word1 in %s 
                );
            """
            cur.execute(temp_table_query, (tuple(table_words), ))

            query = f"""
                WITH t1 AS (
                    SELECT
                        word2,
                        word1 in %s as is_target,
                        max(COALESCE(pmi, 0)) as max_pmi,
                        min(COALESCE(pmi, 0)) as min_pmi,
                        min(COALESCE(joint_value, 0)) as min_joint_value,
                        max(COALESCE(joint_value, 0)) as max_joint_value
                    FROM temp_${game_id}
                    {previous_clues_param}
                    GROUP BY
                        word2, is_target
                ), t2 AS (
                    SELECT
                        word2,
                        COALESCE(MAX(CASE WHEN is_target = TRUE THEN min_pmi ELSE null END), 0) AS min_pmi_target,
                        COALESCE(MAX(CASE WHEN is_target = TRUE THEN max_pmi ELSE null END), 0) AS max_pmi_target,
                        COALESCE(MAX(CASE WHEN is_target = FALSE THEN min_pmi ELSE null END), 0) AS min_pmi_non,
                        COALESCE(MAX(CASE WHEN is_target = FALSE THEN max_pmi ELSE null END), 0) AS max_pmi_non,
                        COALESCE(MAX(CASE WHEN is_target = TRUE THEN min_joint_value ELSE null END), 0) AS min_jv_target,
                        COALESCE(MAX(CASE WHEN is_target = TRUE THEN max_joint_value ELSE null END), 0) AS max_jv_target,
                        COALESCE(MAX(CASE WHEN is_target = FALSE THEN min_joint_value ELSE null END), 0) AS min_jv_non,
                        COALESCE(MAX(CASE WHEN is_target = FALSE THEN max_joint_value ELSE null END), 0) AS max_jv_non
                    FROM t1
                    GROUP BY word2
                )
                SELECT
                    *,
                    min_pmi_target - 0.5 * max_pmi_non AS pmi_diff
                FROM
                    t2
                WHERE
                    min_jv_target > 10
                ORDER BY
                    pmi_diff DESC
                LIMIT 10;
            """
        
            cur.execute(query, (tuple(target_words),))

            # Fetch all rows and print them
            rows = cur.fetchall()
            
            return rows

        except Exception as e:
            print("Error executing SQL query: ", e)
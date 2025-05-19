CREATE TABLE ratings (
    rating_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL,
    score INT CHECK (score BETWEEN 1 AND 5),
    comment TEXT
);

INSERT INTO ratings ( user_id, recipe_id, score, comment) VALUES
( 1, 1, 5, 'Very Good'),
( 2, 2, 4, 'Good'),
( 2, 3, 3, 'Great');    
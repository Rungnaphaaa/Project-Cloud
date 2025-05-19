CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_id INT NOT NULL
);

INSERT INTO favorites (user_id, recipe_id) VALUES
(1, 1),
(1, 2),
(2, 1);
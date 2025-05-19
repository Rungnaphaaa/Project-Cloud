-- สร้างตาราง recipes (สูตรอาหาร) ถ้าไม่มี
CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    recipe_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    cooking_time INT,  -- แก้คำสะกดจาก cookinfg_time เป็น cooking_time
    description TEXT, 
    difficulty VARCHAR(50),
    user_id INT
);

-- สร้างตาราง ingredients (วัตถุดิบ) ถ้าไม่มี
CREATE TABLE ingredients (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL
);

-- สร้างตาราง RecipeIngredients (วัตถุดิบในสูตรอาหาร) ถ้าไม่มี
CREATE TABLE RecipeIngredients (
    recipe_ingredient_id SERIAL PRIMARY KEY,
    recipe_id INT,
    ingredient_id INT,
    quantity DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id)
);

CREATE TABLE recipe_steps (
    step_id SERIAL PRIMARY KEY,
    recipe_id INT NOT NULL,
    step_number INT NOT NULL,
    instruction TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
);

-- เพิ่มข้อมูลในตาราง recipes
-- Insert สูตรอาหาร (recipes)
INSERT INTO recipes (recipe_name, image_url, cooking_time, description, difficulty, user_id) VALUES
('Korean Fried Chicken', '/food_image/Korean Fried Chicken.jpg', 45, 'Crispy fried chicken coated in a sweet and spicy Korean sauce', 'medium', 3),
('Southern Fried Chicken', '/food_image/Southern Fried Chicken.jpg', 60, 'Classic Southern-style fried chicken with rich, spiced flavor', 'medium', 3),
('Japanese Karaage', '/food_image/Japanese Karaage.jpg', 30, 'Japanese-style fried chicken with tender meat and savory seasoning', 'easy', 3),
('Indian Chicken Pakora', '/food_image/Indian Chicken Pakora.jpg', 40, 'Indian-style crispy fried chicken coated in spiced batter', 'medium', 3),
('Thai Fried Chicken (Gai Tod)', '/food_image/Thai Fried Chicken (Gai Tod).jpg', 40, 'Thai-style crispy fried chicken with a balanced flavor', 'easy', 3),
('Vietnamese Fried Chicken', '/food_image/Vietnamese Fried Chicken.jpg', 45, 'Vietnamese-style fried chicken with fragrant spices', 'medium', 3),
('Nigerian Fried Chicken', '/food_image/Nigerian Fried Chicken.jpg', 50, 'Nigerian-style fried chicken with hot and spicy seasoning', 'medium', 3),
('Mexican Pollo Frito', '/food_image/Mexican Pollo Frito.jpg', 50, 'Mexican-style fried chicken with aromatic spices and chili', 'medium', 3),
('Jamaican Jerk Fried Chicken', '/food_image/Jamaican Jerk Fried Chicken.jpeg', 60, 'Spicy and flavorful Jamaican-style jerk fried chicken', 'hard', 3),
('Taiwanese Popcorn Chicken', '/food_image/Taiwanese Popcorn Chicken.png', 35, 'Taiwanese-style bite-sized fried chicken, crispy outside and tender inside', 'easy', 3);


-- Insert วัตถุดิบ (ingredients)
-- เช็คลิสต์วัตถุดิบรวมทั้ง 10 สูตร (ถ้าตารางมีวัตถุดิบนี้แล้ว ควร skip insert ซ้ำ)
INSERT INTO ingredients (name, unit) VALUES
('Chicken', 'pieces'),
('Fried flour', 'grams'),
('Gochujang sauce', 'grams'),
('Honey', 'grams'),
('Garlic', 'cloves'),
('Milk', 'milliliters'),
('Mixed spices (paprika, garlic powder)', 'grams'),
('Flour', 'grams'),
('Ginger', 'grams'),
('Tapioca flour', 'grams'),
('Chickpea flour', 'grams'),
('Indian spices (turmeric, curry powder)', 'grams'),
('Black pepper', 'grams'),
('Lemongrass', 'grams'),
('Chili flakes', 'grams'),
('Lime juice', 'milliliters'),
('Habanero pepper', 'grams'),
('Cinnamon', 'grams'),
('Basil', 'grams'),
('Bay leaf', 'grams');

-- Insert วัตถุดิบในแต่ละสูตร (RecipeIngredients)

-- Korean Fried Chicken (recipe_id = 1)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(1, 1, 5),
(1, 2, 100),
(1, 3, 50),
(1, 4, 20),
(1, 5, 3);

-- Southern Fried Chicken (recipe_id = 2)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(2, 1, 600),
(2, 8, 150),
(2, 6, 200),
(2, 7, 20);

-- Japanese Karaage (recipe_id = 3)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(3, 1, 400),
(3, 9, 20),
(3, 5, 3),
(3, 10, 100);

-- Indian Chicken Pakora (recipe_id = 4)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(4, 1, 500),
(4, 11, 120),
(4, 12, 15);

-- Thai Fried Chicken (Gai Tod) (recipe_id = 5)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(5, 1, 500),
(5, 2, 100),
(5, 5, 4),
(5, 13, 5);

-- Vietnamese Fried Chicken (recipe_id = 6)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(6, 1, 500),
(6, 8, 100),
(6, 9, 15),
(6, 14, 10),
(6, 13, 5);

-- Nigerian Fried Chicken (recipe_id = 7)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(7, 1, 600),
(7, 15, 25),
(7, 9, 15),
(7, 5, 3);

-- Mexican Pollo Frito (recipe_id = 8)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(8, 1, 500),
(8, 7, 30),
(8, 5, 4),
(8, 16, 15);

-- Jamaican Jerk Fried Chicken (recipe_id = 9)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(9, 1, 600),
(9, 17, 20),
(9, 18, 5),
(9, 19, 10);

-- Taiwanese Popcorn Chicken (recipe_id = 10)
INSERT INTO RecipeIngredients (recipe_id, ingredient_id, quantity) VALUES
(10, 1, 400),
(10, 10, 120),
(10, 13, 5),
(10, 20, 3);

-- Insert ขั้นตอนทำอาหาร (recipe_steps)

-- Korean Fried Chicken (recipe_id = 1)
-- Korean Fried Chicken (recipe_id = 1)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(1, 1, 'Wash and cut the chicken into bite-sized pieces'),
(1, 2, 'Marinate the chicken with gochujang sauce, honey, and minced garlic for about 30 minutes'),
(1, 3, 'Coat the chicken evenly with crispy frying flour'),
(1, 4, 'Deep fry in hot oil until golden and crispy, about 8–10 minutes'),
(1, 5, 'Toss the chicken in the remaining sauce and serve');

-- Southern Fried Chicken (recipe_id = 2)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(2, 1, 'Wash and cut the chicken into appropriate-sized pieces'),
(2, 2, 'Soak the chicken in milk and mixed spices for about 20 minutes'),
(2, 3, 'Coat the chicken evenly with flour'),
(2, 4, 'Deep fry in hot oil until crispy and fully cooked, about 12–15 minutes'),
(2, 5, 'Drain excess oil and serve');

-- Japanese Karaage (recipe_id = 3)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(3, 1, 'Wash and cut the chicken into small pieces'),
(3, 2, 'Marinate the chicken with soy sauce, ginger, and garlic for about 20 minutes'),
(3, 3, 'Coat the chicken evenly with potato starch'),
(3, 4, 'Deep fry in hot oil until crispy and cooked, about 5–7 minutes'),
(3, 5, 'Drain excess oil and serve');

-- Indian Chicken Pakora (recipe_id = 4)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(4, 1, 'Cut the chicken into small pieces'),
(4, 2, 'Mix chickpea flour and Indian spices together'),
(4, 3, 'Coat the chicken evenly with the flour mixture'),
(4, 4, 'Deep fry in hot oil until crispy and cooked, about 8–10 minutes'),
(4, 5, 'Drain excess oil and serve');

-- Thai Fried Chicken (Gai Tod) (recipe_id = 5)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(5, 1, 'Wash and cut the chicken into proper-sized pieces'),
(5, 2, 'Marinate the chicken with garlic and pepper for about 20 minutes'),
(5, 3, 'Coat the chicken evenly with crispy frying flour'),
(5, 4, 'Deep fry in hot oil until crispy and cooked, about 10–12 minutes'),
(5, 5, 'Drain excess oil and serve');

-- Vietnamese Fried Chicken (recipe_id = 6)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(6, 1, 'Wash and cut the chicken into proper-sized pieces'),
(6, 2, 'Marinate the chicken with ginger, lemongrass, and pepper for about 30 minutes'),
(6, 3, 'Coat the chicken evenly with flour'),
(6, 4, 'Deep fry in hot oil until crispy and cooked, about 10 minutes'),
(6, 5, 'Drain excess oil and serve');

-- Nigerian Fried Chicken (recipe_id = 7)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(7, 1, 'Wash and cut the chicken into proper-sized pieces'),
(7, 2, 'Marinate the chicken with African spices and ginger for about 30 minutes'),
(7, 3, 'Coat the chicken with crispy frying flour'),
(7, 4, 'Deep fry in hot oil until crispy and cooked, about 12 minutes'),
(7, 5, 'Drain excess oil and serve');

-- Mexican Pollo Frito (recipe_id = 8)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(8, 1, 'Wash and cut the chicken into proper-sized pieces'),
(8, 2, 'Marinate the chicken with paprika, garlic, and lime juice for about 30 minutes'),
(8, 3, 'Coat the chicken with crispy frying flour'),
(8, 4, 'Deep fry in hot oil until crispy and cooked, about 12 minutes'),
(8, 5, 'Drain excess oil and serve');

-- Jamaican Jerk Fried Chicken (recipe_id = 9)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(9, 1, 'Wash and cut the chicken into proper-sized pieces'),
(9, 2, 'Marinate the chicken with Jerk spices (habanero, cinnamon, basil) for about 40 minutes'),
(9, 3, 'Coat the chicken with crispy frying flour'),
(9, 4, 'Deep fry in hot oil until crispy and cooked, about 15 minutes'),
(9, 5, 'Drain excess oil and serve');

-- Taiwanese Popcorn Chicken (recipe_id = 10)
INSERT INTO recipe_steps (recipe_id, step_number, instruction) VALUES
(10, 1, 'Cut the chicken into bite-sized pieces'),
(10, 2, 'Marinate the chicken with pepper and bay leaves for about 20 minutes'),
(10, 3, 'Coat the chicken evenly with potato starch'),
(10, 4, 'Deep fry in hot oil until crispy, about 6–8 minutes'),
(10, 5, 'Drain excess oil and serve');

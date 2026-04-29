# Instructions on how to set up and run this application  
*You must have MongoDB Compass, Visual Studio Code and a web browser already installed, and cloned our repository to your device.*
## 1. Database setup
0. In the file code\API\endpoints.py of this repository, there're two lines declaring client and db. Change their information corresponding to the database and server names in your device.
1. Open MongoDB Compass and connect to the database (create one and its first collection if you haven't).
2. Connect to the database with the same name as you declared in the file endpoints.py.
3. Create its two collection: products and categories.
4. Select the collection categories, click "Add data", and import the file data\category\categories.json into it.
5. Select the collection products, click "Add data" and import the three json files in data\product into it. These file contains seed product data for three categories: phone, fashion and book.
   
## 2. Application running
1. Run the file code\API\endpoints.py. If these lines appear in your terminal, you succeed.
     @app.on_event("startup")
   INFO:     Started server process [14024]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
2. Right click on the file code\API\gui_CUD_frame.html to open the web on a web browser.
*In case you run the file code\API\endpoints.py and this line appears instead:
  ERROR:    Application startup failed. Exiting.
Check the def startup_event() in endpoint.py and look for this line (around line 58):
  db.products.create_index("reviews.rev_id", unique = True, sparse=True)
and delete the "unique = True," part, then run endpoints.py again. That must do the thing.*

## 3. Application using guide
### 1. View
- The products are separated into categories. Use the three category button on the top right to change into the category you want to view and scroll around.
- Click on a specific product to see its details, and Back to return to Default category view mode.
- Type a keyword or a number in the Search bar on the top right to search. Products in the current category that matches your keywords in name, description or price will appear.
- Empty the search bar to back to Default category view mode.
### 2. Insert
1. Click on the Insert button on the top left of the screen.
2. Fill in all the entries and category box. For Attributes and Reviews, feel free to add as information if you want.
3. Click Confirm -> OK to add new product. There will be a remind if you click Confirm while leaving any entry blank. The new product will appear in its category.
4. Click Cancel to empty the left screen if you don't want to insert product anymore.
### 3. Update
1. Select the category of the product you want to update, and its product name.
2. Change the information you want to update. You can also delete or add new attribute or review.
3. Click Confirm -> OK to confirm the changes on the products. Or click Cancel to empty the left screen if you don't want to update anymore.
### 4. Delete
1. Select the category of the product you want to delete, and its product name. Its information will appear for you to view.
2. 3. Click Confirm -> OK to delete the products. Or click Cancel to empty the left screen if you don't want to delete anymore.

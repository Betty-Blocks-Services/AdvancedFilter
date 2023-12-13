# CustomFilterComponent

The CustomFilterComponent allows you to filter relational data. It's important to note that this functionality is specifically designed for use with "Has Many" and "Belongs to" relations and is limited to one level of depth.

## Property Whitelist

The property whitelist displays all available filter options. To customize the displayed properties, follow these steps:

1. Open the data model to view its properties.
   ![Data Model](public/image1.png)

2. Next to each property, find the database name. Use this name but remove underscores "_" and capitalize each letter that follows the underscore. For example, `amount_of_items` becomes `amountOfItems`.

3. Fill in the desired properties in the Property Whitelist:
   ![Whitelist Example](public/image2.png)
   ![Whitelist Example](public/image3.png)

## Relational Filtering

If you want to display specific properties from your relational model, use the following format:
```webuser(firstName,lastName)```
This example will show the Webuser as a property that the user can select. After selecting this property, a new select field will appear. In this field, the user can choose from the whitelisted properties (or all if no whitelist is set).

### IMPORTANT NOTES:
The ID will always be visible in the select components.
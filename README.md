# CustomFilterComponent
This custom filter component can filter on relational data. PLEASE NOTE: This only works with "Has Many" and "Belongs to" relations and can only go one level deep.

You can keep the property whitelist as is to show all the available filter options to the user. If you want to whitelist certain properties, you can use the following method to select the properties.

1. Open the data model to view its properties.
![Alt text](public/image1.png)

2. Next to each property, the database name is listed. You can use this name but you have to remove the underscores "_" and capitalize each letter. Example given: ```amount_of_items``` becomes ```amountOfItems```.

3. Fill in the properties in the Property Whitelist:
![Alt text](public/image2.png)

## Relational filtering
If you wish to only show certain properties from your relational model then you need to apply the following format:
```webuser(firstName,lastName)```
This will only show the ID, First Name and Last Name.


### IMPORTANT NOTES:
The ID will always be visible in the select components. 
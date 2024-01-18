(() => ({
    name: 'Filter',
    type: 'CONTAINER_COMPONENT',
    allowedTypes: [],
    orientation: 'HORIZONTAL',
    jsx: (() => {
        const { env, Icon, getProperty } = B;
        const { MenuItem, TextField, Button, ButtonGroup, IconButton, Checkbox, Grid } =
            window.MaterialUI.Core;
        const { DateFnsUtils } = window.MaterialUI;
        const {
            MuiPickersUtilsProvider,
            KeyboardDatePicker,
            KeyboardDateTimePicker,
        } = window.MaterialUI.Pickers;

        const { modelId, propertyWhiteList, propertyBlackList, actionVariableId: name } = options;
        const isDev = env === 'dev';
        const makeId = (length = 16) => {
            let result = '';
            const characters =
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const charactersLength = characters.length;
            for (let i = 0; i < length; i += 1) {
                result += characters.charAt(
                    Math.floor(Math.random() * charactersLength),
                );
            }
            return result;
        };

        const initialState = [
            {
                id: makeId(),
                operator: '_and',
                groups: [],
                rows: [
                    {
                        rowId: makeId(),
                        propertyValue: '',
                        operator: 'eq',
                        rightValue: '',
                    },
                ],
            },
        ];
        const [groups, setGroups] = React.useState(initialState);
        const [groupsOperator, setGroupsOperator] = React.useState('_and');

        const [filter, setFilter] = useState(null);

        const stringKinds = [
            'string',
            'string_expression',
            'email_address',
            'zipcode',
            'url',
            'text',
            'text_expression',
            'rich_text',
            'auto_increment',
            'phone_number',
            'iban',
            'list',
        ];
        const numberKinds = [
            'serial',
            'count',
            'decimal',
            'decimal_expression',
            'float',
            'integer',
            'integer_expression',
            'price',
            'price_expression',
            'minutes',
        ];
        const dateKinds = ['date', 'date_expression'];
        const dateTimeKinds = ['date_time_expression', 'date_time', 'time'];
        const booleanKinds = ['boolean', 'boolean_expression'];
        const forbiddenKinds = [
            'has_and_belongs_to_many',
            // 'has_many',
            'has_one',
            'image',
            'file',
            'password',
            'pdf',
            'multi_image',
            'multi_file',
        ];
        const operatorList = [
            {
                operator: 'eq',
                label: 'Is gelijk aan',
                kinds: ['*'],
            },
            {
                operator: 'neq',
                label: 'Is niet gelijk aan',
                kinds: ['*'],
            },
            {
                operator: 'ex',
                label: 'Bestaat',
                kinds: ['*'],
            },
            {
                operator: 'nex',
                label: 'Bestaat niet',
                kinds: ['*'],
            },
            {
                operator: 'starts_with',
                label: 'Begint met',
                kinds: [...stringKinds],
            },
            {
                operator: 'ends_with',
                label: 'Eindigt met',
                kinds: [...stringKinds],
            },
            {
                operator: 'matches',
                label: 'Bevat',
                kinds: [...stringKinds],
            },
            {
                operator: 'does_not_match',
                label: 'Bevat niet',
                kinds: [...stringKinds],
            },
            {
                operator: 'gt',
                label: 'Groter dan',
                kinds: [...numberKinds],
            },
            {
                operator: 'lt',
                label: 'Kleiner dan',
                kinds: [...numberKinds],
            },
            {
                operator: 'gteq',
                label: 'Groter dan of gelijk aan',
                kinds: [...numberKinds],
            },
            {
                operator: 'lteq',
                label: 'Kleiner dan of gelijk aan',
                kinds: [...numberKinds],
            },
            {
                operator: 'gt',
                label: 'Is na',
                kinds: [...dateKinds, ...dateTimeKinds],
            },
            {
                operator: 'lt',
                label: 'Is voor',
                kinds: [...dateKinds, ...dateTimeKinds],
            },
            {
                operator: 'gteq',
                label: 'Is na of op',
                kinds: [...dateKinds, ...dateTimeKinds],
            },
            {
                operator: 'lteq',
                label: 'Is voor of op',
                kinds: [...dateKinds, ...dateTimeKinds],
            },
        ];
        B.defineFunction('Add filter group', () => {
            setGroups([
                ...groups,
                {
                    id: makeId(),
                    operator: '_or',
                    groups: [],
                    rows: [
                        {
                            rowId: makeId(),
                            propertyValue: '',
                            operator: 'eq',
                            rightValue: '',
                        },
                    ],
                },
            ]);
        });

        B.defineFunction('Reset advanced filter', () => {
            setGroups(initialState);
        });

        const whiteListItems =
            (propertyWhiteList && propertyWhiteList.replace(/\b\((?:[a-z]+(?:,[a-zA-Z]+)*)\)/g, '').split(',')) || [];
        const blackListItems =
            (propertyBlackList && propertyBlackList.split(',')) || [];
        const filterProps = (properties, id, optional = '') => {
            return Object.values(properties).filter((prop) => {
                return (
                    // Always add the id
                    (prop.modelId === id && prop.name === 'id') ||
                    // Add all properties besides the forbidden
                    (prop.modelId === id &&
                        !forbiddenKinds.includes(prop.kind) &&
                        whiteListItems.length === 0) ||
                    // Only add properties who are whitelisted and not forbidden
                    (prop.modelId === id &&
                        !forbiddenKinds.includes(prop.kind) &&
                        whiteListItems.length > 0 &&
                        whiteListItems.includes(prop.name) &&
                        prop.kind !== optional) ||
                    // Only add properties who are not blacklisted and not forbidden
                    (prop.modelId === id &&
                        !forbiddenKinds.includes(prop.kind) &&
                        blackListItems.length > 0 &&
                        !blackListItems.includes(prop.name) &&
                        prop.kind !== optional)
                );
            });
        };

        // Get all items from the propertyWhiteList with the following regex: /\b(\w+)\((?:[a-zA-Z]+(?:,[a-zA-Z]+)*)\)\,/g
        // And example of a matching string is: text(can,contains,multipleValues)
        // This indicates a belongs to relationship with the following values: can,contains,values
        const whiteListParents = (propertyWhiteList && propertyWhiteList.match(/\b(\w+)\((?:[a-zA-Z]+(?:,[a-zA-Z]+)*)\)/g)) || [];
        
        const filterParentProps = (properties, selectedProp) => {
            const referenceModelId = selectedProp.referenceModelId;
            const propertiesForModel = Object.values(properties).filter((prop) => {
                if (prop.modelId === referenceModelId) {
                    return prop;
                }
            });
            const result = propertiesForModel.filter((prop) => {
                // Find the item in the whiteListParents that matches the current prop.name
                const rx = new RegExp(`\\b(${selectedProp.name})\\((?:[a-zA-Z]+(?:,[a-zA-Z]+)*)\\)`)
                const whiteListParentItem = whiteListParents.find((item) =>
                    item.match(rx)
                )
                let parentProperties = [];
                if (whiteListParentItem) {
                    // Match anything between the brackets and split on comma
                    parentProperties = whiteListParentItem.match(/\(([^)]+)\)/)[1].split(',') || [];
                }
                const property = (
                    // Always add the id
                    (prop.name === 'id') ||
                    (!forbiddenKinds.includes(prop.kind) &&
                        whiteListItems.length === 0) ||
                    (!forbiddenKinds.includes(prop.kind) &&
                        parentProperties.length > 0 &&
                        parentProperties.includes(prop.name))
                );

                return property
            });

            return result;
        }

        const filterOperators = (kind, operators) => {
            if (!kind) return operators;
            return operators.filter((op) => {
                return op.kinds.includes(kind) || op.kinds.includes('*');
            });
        };
        const renderOption = (key, value) => {
            if (value !== "Created at" && value !== "Updated at") {
                return (
                    <MenuItem key={key} value={key}>
                        {value}
                    </MenuItem>
                );
            } else {
                return (
                    <MenuItem key={key} value={key}>
                        {value == "Created at" ? "Aangemaakt op" : "Laatst bijgewerkt op"}
                    </MenuItem>
                );
            }

        };
        const makeFilterChild = (prop, op, right) => {
            switch (op) {
                case 'ex':
                    if (typeof prop !== "object") {
                        return {
                            [prop]: {
                                exists: true,
                            },
                        };
                    } else {
                        const model = Object.keys(prop)[0];
                        const property = prop[model];
                        return {
                            [model]: {
                                [property]: {
                                    exists: true,
                                }
                            }
                        }
                    }
                case 'nex':
                    if (typeof prop !== "object") {
                        return {
                            [prop]: {
                                does_not_exist: 0,
                            },
                        };
                    } else {
                        const model = Object.keys(prop)[0];
                        const property = prop[model];
                        return {
                            [model]: {
                                [property]: {
                                    does_not_exist: 0,
                                }
                            }
                        }
                    }
                default:
                    if (typeof prop !== "object") {
                        return {
                            [prop]: {
                                [op]: right,
                            },
                        };
                    } else {
                        const model = Object.keys(prop)[0];
                        const property = prop[model];
                        return {
                            [model]: {
                                [property]: {
                                    [op]: right,
                                }
                            }
                        }
                    }
            }
        };
        const makeFilter = (tree) => {
            return {
                where: {
                    [groupsOperator]: tree.map((node) => {
                        return {
                            [node.operator]: node.rows.map((subnode) => {
                                return makeFilterChild(
                                    subnode.propertyValue,
                                    subnode.operator,
                                    subnode.rightValue,
                                );
                            }),
                        };
                    }),
                },
            };
        };

        const makeReadableFilter = (tree) => {
            return {
                where: {
                    [groupsOperator]: tree.map((node) => {
                        return {
                            [node.operator]: node.rows.map((subnode) => {
                                // Get the key of the propertyValue. This is the id of the property
                                if (typeof subnode.propertyValue === "string") {
                                    const propertyInfo = getProperty(subnode.propertyValue)
                                    // Use the id  of the property to get its information
                                    // Get the name of the property from the propertyInfo
                                    const propertyName = propertyInfo.name

                                    return makeFilterChild(
                                        propertyName,
                                        subnode.operator,
                                        subnode.rightValue,
                                    );
                                }
                                if (typeof subnode.propertyValue === 'object') {
                                    const key = Object.keys(subnode.propertyValue)[0];
                                    const value = Object.values(subnode.propertyValue)[0];
                                    const modelInfo = getProperty(key);
                                    const modelName = modelInfo.name;
                                    const propertyInfo = getProperty(value);
                                    const propertyName = propertyInfo.name;

                                    return makeFilterChild(
                                        { [modelName]: propertyName },
                                        subnode.operator,
                                        subnode.rightValue,
                                    );
                                }
                            }),
                        };
                    }),
                },
            };
        };

        const updateRowProperty = (rowId, tree, propertyToUpdate, newValue) => {
            return tree.map((group) => {
                const foundRow = group.rows.filter((row) => row.rowId === rowId);
                if (foundRow.length === 0) {
                    // eslint-disable-next-line no-param-reassign
                    group.groups = updateRowProperty(
                        rowId,
                        group.groups,
                        propertyToUpdate,
                        newValue,
                    );
                    return group;
                }
                group.rows.map((row) => {
                    const newRow = row;
                    if (row.rowId === rowId) {
                        newRow[propertyToUpdate] = newValue;
                    }
                    return newRow;
                });
                return group;
            });
        };


        const updateGroupProperty = (groupId, tree, propertyToUpdate, newValue) => {
            return tree.map((group) => {
                if (group.id === groupId) {
                    const newGroup = group;
                    newGroup[propertyToUpdate] = newValue;
                    return newGroup;
                }
                const foundGroup = group.groups.filter((g) => g.id === groupId);
                if (foundGroup.length === 0) {
                    // eslint-disable-next-line no-param-reassign
                    group.groups = updateGroupProperty(
                        groupId,
                        group.groups,
                        propertyToUpdate,
                        newValue,
                    );
                    return group;
                }
                group.groups.map((grp) => {
                    const newGroup = grp;
                    if (grp.id === groupId) {
                        newGroup[propertyToUpdate] = newValue;
                    }
                    return newGroup;
                });
                return group;
            });
        };
        const deleteFilter = (tree, rowId) => {
            return tree.map((group) => {
                const foundRow = group.rows.filter((row) => row.rowId === rowId);
                if (foundRow.length === 0) {
                    // eslint-disable-next-line no-param-reassign
                    group.groups = deleteFilter(group.groups, rowId);
                    return group;
                }
                // eslint-disable-next-line no-param-reassign
                group.rows = group.rows.filter((row) => row.rowId !== rowId);
                return group;
            });
        };

        const PropertySelector = ({ row, properties, filteredProps }) => {
            let selectedParent;
            let selectedIndex;

            if (typeof row.propertyValue === "object") {
                const model = Object.keys(row.propertyValue)[0];
                selectedParent = model;
                selectedIndex = filteredProps.findIndex((p) => p.id === model);
            } else {
                selectedIndex = filteredProps.findIndex((p) => p.id === row.propertyValue);
            }
            const selectedProp = filteredProps[selectedIndex];

            const handleChangeBaseField = (e) => {
                const prop = Object.values(properties).find((p) => p.id === e.target.value);

                if (prop.kind === 'belongs_to' || prop.kind === 'has_many') {
                    const parentProps = filterParentProps(properties, prop);
                    setGroups(
                        updateRowProperty(
                            row.rowId,
                            groups,
                            'propertyValue',
                            { [e.target.value]: parentProps[0].id },
                        ),
                    );
                    setGroups(updateRowProperty(row.rowId, groups, 'rightValue', ''));
                } else {
                    setGroups(
                        updateRowProperty(
                            row.rowId,
                            groups,
                            'propertyValue',
                            e.target.value,
                        ),
                    );
                    setGroups(updateRowProperty(row.rowId, groups, 'rightValue', ''));
                }
            }
            if (selectedProp && selectedProp.kind !== 'belongs_to' && selectedProp.kind !== 'has_many') {
                return (
                    <TextField
                        value={row.propertyValue}
                        classes={{ root: classes.textFieldHighlight }}
                        select
                        size="small"
                        variant="outlined"
                        style={{ marginRight: '10px', width: '100%' }}
                        onChange={handleChangeBaseField}
                    >
                        {filteredProps.map((prop) => renderOption(prop.id, prop.label))}
                    </TextField>
                )
            } else {
                const parentProps = filterParentProps(properties, selectedProp);
                const selectedChildProp = Object.values(row.propertyValue)[0];
                return (
                    <Grid container spacing={1} justifyContent="space-between" xs={12}>
                        <Grid item xs={6}>
                            <TextField
                                value={selectedParent}
                                classes={{ root: classes.textFieldHighlight }}
                                select
                                size="small"
                                variant="outlined"
                                fullWidth
                                style={{ marginRight: '10px', width: '100%' }}
                                onChange={handleChangeBaseField}
                            >
                                {filteredProps.map((prop) => renderOption(prop.id, prop.label))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                value={selectedChildProp}
                                classes={{ root: classes.textFieldHighlight }}
                                select
                                size="small"
                                variant="outlined"
                                fullWidth
                                style={{ marginRight: '10px', width: '100%' }}
                                onChange={(e) => {
                                    setGroups(
                                        updateRowProperty(
                                            row.rowId,
                                            groups,
                                            'propertyValue',
                                            { [selectedParent]: e.target.value },
                                        ),
                                    );
                                    setGroups(updateRowProperty(row.rowId, groups, 'rightValue', ''));
                                }}
                            >
                                {parentProps.map((prop) => renderOption(prop.id, prop.label))}
                            </TextField>
                        </Grid>
                    </Grid>
                )
            }
        }

        const filterRow = (row, deletable) => {
            if (!modelId) return <p>Please select a model</p>;
            // eslint-disable-next-line no-undef
            const { properties } = artifact || {};
            console.log(" ~ file: filterComponent.js:576 ~ filterRow ~ properties:", properties)

            const filteredProps = filterProps(properties, modelId).sort((a, b) =>
                a.label.localeCompare(b.label),
            );
            console.log(" ~ file: filterComponent.js:581 ~ filterRow ~ filteredProps:", filteredProps)
            
            // set initial dropdown value
            if (row.propertyValue === '') {
                const firstProp = Object.values(properties).find(
                    p => p.id === filteredProps[0].id,
                );
          
                if (firstProp.kind === 'belongs_to' || firstProp.kind === 'has_many') {
                    const parentProps = filterParentProps(properties, firstProp);
                    setGroups(
                        updateRowProperty(row.rowId, groups, 'propertyValue', {
                            [firstProp.id]: parentProps[0].id,
                        }),
                    );
                } else {
                    setGroups(
                        updateRowProperty(row.rowId, groups, 'propertyValue', firstProp.id),
                    );
                }
            }

            let selectedIndex = null;
            let selectedProp;

            if (typeof row.propertyValue === 'object') {
                // Handle belongs_to

                // Get the id of the currently selected property
                const m = Object.keys(row.propertyValue)[0]
                // Find the object in the artifact's properties key
                const mObject = properties[m]
                // Get the id of the currently selected property that belongs to the model
                const p = Object.values(row.propertyValue)[0]

                // Get the properties of the belongs_to model
                const parentProps = filterParentProps(properties, mObject);

                // Find the index of the currently selected property (which is the parent model)
                selectedIndex = parentProps.findIndex(
                    (prop) => prop.id === p,
                );
                // Get the property object of the currently selected property
                selectedProp = parentProps[selectedIndex];
            } else {
                selectedIndex = filteredProps.findIndex(
                    (prop) => prop.id === row.propertyValue,
                );
                selectedProp = filteredProps[selectedIndex];
            }

            const isNumberType = numberKinds.includes(selectedProp.kind);
            const isDateType = dateKinds.includes(selectedProp.kind);
            const isDateTimeType = dateTimeKinds.includes(selectedProp.kind);
            const isBooleanType = booleanKinds.includes(selectedProp.kind);
            const isSpecialType = row.operator === 'ex' || row.operator === 'nex';

            const inputType = () => {
                if (isNumberType) return 'number';
                return 'text';
            };

            const isTextType =
                !isSpecialType && !isBooleanType && !isDateTimeType && !isDateType;

            return (
                <div key={row.rowId} style={{ width: '100%', marginBottom: '10px' }}>

                    <Grid container spacing={2} xs={12} >
                        <Grid item xs={5}>
                            <PropertySelector row={row} properties={properties} filteredProps={filteredProps} />
                        </Grid>
                        <Grid item xs={2}>
                            <TextField
                                size="small"
                                value={row.operator}
                                classes={{ root: classes.textFieldHighlight }}
                                select
                                variant="outlined"
                                fullWidth
                                style={{ marginRight: '10px', width: '100%' }}
                                onChange={(e) => {
                                    setGroups(
                                        updateRowProperty(
                                            row.rowId,
                                            groups,
                                            'operator',
                                            e.target.value,
                                        ),
                                    );
                                }}
                            >
                                {filterOperators(selectedProp.kind, operatorList).map((op) => {
                                    return renderOption(op.operator, op.label);
                                })}
                            </TextField>
                        </Grid>
                        <Grid item xs={4}>

                            {isTextType && (
                                <TextField
                                    size="small"
                                    value={row.rightValue}
                                    classes={{ root: classes.textFieldHighlight }}
                                    style={{ width: '100%' }}
                                    type={inputType()}
                                    fullWidth
                                    variant="outlined"
                                    onChange={(e) => {
                                        setGroups(
                                            updateRowProperty(
                                                row.rowId,
                                                groups,
                                                'rightValue',
                                                e.target.value,
                                            ),
                                        );
                                    }}
                                />
                            )}
                            {isBooleanType && !isSpecialType && (
                                <Checkbox
                                    checked={row.rightValue}
                                    classes={{ checked: classes.checkBox }}
                                    onChange={(e) => {
                                        setGroups(
                                            updateRowProperty(
                                                row.rowId,
                                                groups,
                                                'rightValue',
                                                e.target.checked,
                                            ),
                                        );
                                    }}
                                    inputProps={{ 'aria-label': 'primary checkbox' }}
                                />
                            )}
                            {isDateType && !isSpecialType && (
                                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                    <KeyboardDatePicker
                                        margin="none"
                                        classes={{
                                            toolbar: classes.datePicker,
                                            daySelected: classes.datePicker,
                                            root: classes.textFieldHighlight,
                                        }}
                                        size="small"
                                        value={row.rightValue === '' ? null : row.rightValue}
                                        initialFocusedDate={new Date()}
                                        style={{ width: '100%', margin: '0px' }}
                                        id="date-picker-dialog"
                                        variant="inline"
                                        inputVariant="outlined"
                                        format="dd-MM-yyyy"
                                        KeyboardButtonProps={{
                                            'aria-label': 'change date',
                                        }}
                                        onKeyDown={(e) => {
                                            e.preventDefault();
                                        }}
                                        allowKeyboardControl={false}
                                        onChange={(date) => {
                                            const dateValue = date.toISOString().split('T')[0];
                                            setGroups(
                                                updateRowProperty(
                                                    row.rowId,
                                                    groups,
                                                    'rightValue',
                                                    dateValue,
                                                ),
                                            );
                                        }}
                                    />
                                </MuiPickersUtilsProvider>
                            )}
                            {isDateTimeType && !isSpecialType && (
                                <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                    <KeyboardDateTimePicker
                                        margin="none"
                                        classes={{
                                            toolbar: classes.datePicker,
                                            daySelected: classes.datePicker,
                                            root: classes.textFieldHighlight,
                                        }}
                                        id="date-picker-dialog"
                                        style={{ width: '100%', margin: '0px' }}
                                        size="small"
                                        value={row.rightValue === '' ? null : row.rightValue}
                                        variant="inline"
                                        inputVariant="outlined"
                                        format="dd-MM-yyyy"
                                        KeyboardButtonProps={{
                                            'aria-label': 'change date',
                                        }}
                                        onKeyDown={(e) => {
                                            e.preventDefault();
                                        }}
                                        allowKeyboardControl={false}
                                        onChange={(date) => {
                                            setGroups(
                                                updateRowProperty(
                                                    row.rowId,
                                                    groups,
                                                    'rightValue',
                                                    date.toISOString(),
                                                ),
                                            );
                                        }}
                                    />
                                </MuiPickersUtilsProvider>
                            )}
                        </Grid>
                        <Grid item xs={1}>
                            {deletable && (
                                <IconButton
                                    aria-label="delete"
                                    onClick={() => {
                                        setGroups(deleteFilter(groups, row.rowId));
                                    }}
                                >
                                    <Icon name="Delete" fontSize="small" />
                                </IconButton>
                            )}
                        </Grid>
                    </Grid>
                </div>
            );
        };
        const filterRowDev = () => {
            return (
                <div style={{ width: '100%', marginBottom: '10px' }}>
                    <TextField
                        disabled
                        select
                        size="small"
                        variant="outlined"
                        style={{ marginRight: '10px', width: '33%' }}
                    />
                    <TextField
                        size="small"
                        disabled
                        select
                        variant="outlined"
                        style={{ marginRight: '10px', width: '15%' }}
                    />
                    <TextField
                        size="small"
                        disabled
                        type="text"
                        style={{ width: '33%' }}
                        variant="outlined"
                    />
                    <IconButton aria-label="delete" disabled>
                        <Icon name="Delete" fontSize="small" />
                    </IconButton>
                </div>
            );
        };
        const addFilter = (tree, groupId) => {
            const newRow = {
                rowId: makeId(),
                propertyValue: '',
                operator: 'eq',
                rightValue: '',
            };

            return tree.map((group) => {
                if (group.id === groupId) {
                    group.rows.push(newRow);
                    return group;
                }
                // eslint-disable-next-line no-param-reassign
                group.groups = addFilter(group.groups, groupId);
                return group;
            });
        };
        const addFilterButton = (group, dev) => {
            return (
                <Button
                    type="button"
                    disabled={dev}
                    style={{ textTransform: 'none' }}
                    onClick={() => {
                        setGroups(addFilter(groups, group.id));
                    }}
                >
                    <Icon name="Add" fontSize="small" />
                    Filter regel toevoegen
                </Button>
            );
        };
        const deleteGroup = (tree, groupId) => {
            const newTree = tree.slice();
            const foundIndex = newTree.findIndex((g) => g.id === groupId);

            if (foundIndex > -1) {
                newTree.splice(foundIndex, 1);
            }
            return newTree;
        };
        const operatorSwitch = (node, dev) => {
            return (
                <ButtonGroup size="small" className={classes.operator} disabled={dev}>
                    <Button
                        disableElevation
                        variant="contained"
                        classes={{ containedPrimary: classes.highlight }}
                        color={node.operator === '_and' ? 'primary' : 'default'}
                        onClick={() => {
                            setGroups(
                                updateGroupProperty(node.id, groups, 'operator', '_and'),
                            );
                        }}
                    >
                        en
                    </Button>
                    <Button
                        disableElevation
                        variant="contained"
                        classes={{ containedPrimary: classes.highlight }}
                        color={node.operator === '_or' ? 'primary' : 'default'}
                        onClick={() => {
                            setGroups(
                                updateGroupProperty(node.id, groups, 'operator', '_or'),
                            );
                        }}
                    >
                        of
                    </Button>
                </ButtonGroup>
            );
        };



        const renderTree = (tree, dev) => {
            return (
                <>
                    <input type="hidden" name={name} value={encodeURI(JSON.stringify(filter))} />
                    {tree.map((node, index) => (
                        <>
                            <div key={node.id} className={classes.filter}>
                                {tree.length > 1 && (
                                    <div className={classes.deleteGroup}>
                                        <IconButton
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const newGroups = deleteGroup(groups, node.id);
                                                setGroups(newGroups);
                                            }}
                                        >
                                            <Icon name="Delete" fontSize="small" />
                                        </IconButton>
                                    </div>
                                )}
                                {operatorSwitch(node, dev)}

                                {node.rows.map((row) =>
                                    dev ? filterRowDev() : filterRow(row, node.rows.length > 1),
                                )}
                                {addFilterButton(node, dev)}
                            </div>
                            {index + 1 < tree.length && (
                                <ButtonGroup size="small" disabled={dev}>
                                    <Button
                                        disableElevation
                                        variant="contained"
                                        color={groupsOperator === '_and' ? 'primary' : 'default'}
                                        classes={{ containedPrimary: classes.highlight }}
                                        onClick={() => {
                                            setGroupsOperator('_and');
                                        }}
                                    >
                                        en
                                    </Button>
                                    <Button
                                        disableElevation
                                        variant="contained"
                                        color={groupsOperator === '_or' ? 'primary' : 'default'}
                                        classes={{ containedPrimary: classes.highlight }}
                                        onClick={() => {
                                            setGroupsOperator('_or');
                                        }}
                                    >
                                        of
                                    </Button>
                                </ButtonGroup>
                            )}
                        </>
                    ))}
                </>
            );
        };

        B.defineFunction('Apply filter', () => {
            try {
                console.info("Applying filter... Please wait");
                handleApplyFilter();
            } catch (exception) {
                console.error("An error occurred while applying the filter:", exception);
            }
        });

        const handleApplyFilter = () => {
            const readableFilter = makeReadableFilter(groups);
            console.info("Readable filter ready! Output:")
            console.info(readableFilter)

            setFilter(readableFilter);

            const newFilter = makeFilter(groups);

            console.info("Filter for datatable ready! Output:")
            console.info(newFilter)

            B.triggerEvent('onSubmit', newFilter);
        }



        return isDev ? (
            <div className={`${classes.root}`}>{renderTree(groups, true)}</div>
        ) : (
            <div className={classes.root}>{renderTree(groups)}</div>
        );
    })(),
    styles: (B) => (theme) => {
        const { env, Styling, mediaMinWidth } = B;
        const isDev = env === 'dev';
        const style = new Styling(theme);
        const getSpacing = (idx, device = 'Mobile') =>
            idx === '0' ? '0rem' : style.getSpacing(idx, device);

        return {
            root: {
                marginTop: ({ options: { outerSpacing } }) =>
                    getSpacing(outerSpacing[0]),
                marginRight: ({ options: { outerSpacing } }) =>
                    getSpacing(outerSpacing[1]),
                marginBottom: ({ options: { outerSpacing } }) =>
                    getSpacing(outerSpacing[2]),
                marginLeft: ({ options: { outerSpacing } }) =>
                    getSpacing(outerSpacing[3]),
                [`@media ${mediaMinWidth(600)}`]: {
                    marginTop: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[0], 'Portrait'),
                    marginRight: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[1], 'Portrait'),
                    marginBottom: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[2], 'Portrait'),
                    marginLeft: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[3], 'Portrait'),
                },
                [`@media ${mediaMinWidth(960)}`]: {
                    marginTop: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[0], 'Landscape'),
                    marginRight: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[1], 'Landscape'),
                    marginBottom: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[2], 'Landscape'),
                    marginLeft: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[3], 'Landscape'),
                },
                [`@media ${mediaMinWidth(1280)}`]: {
                    marginTop: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[0], 'Desktop'),
                    marginRight: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[1], 'Desktop'),
                    marginBottom: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[2], 'Desktop'),
                    marginLeft: ({ options: { outerSpacing } }) =>
                        getSpacing(outerSpacing[3], 'Desktop'),
                },
                width: ({ options: { width } }) => !isDev && width,
                height: ({ options: { height } }) => (isDev ? '100%' : height),
                minHeight: 0,
            },
            textFieldHighlight: {
                '& .MuiInputBase-root': {
                    '&.Mui-focused, &.Mui-focused:hover': {
                        '& .MuiOutlinedInput-notchedOutline, & .MuiFilledInput-underline, & .MuiInput-underline':
                        {
                            borderColor: ({ options: { highlightColor } }) => [
                                style.getColor(highlightColor),
                                '!important',
                            ],
                        },
                    },
                },
            },
            checkBox: {
                color: ({ options: { highlightColor } }) => [
                    style.getColor(highlightColor),
                    '!important',
                ],
            },
            datePicker: {
                backgroundColor: ({ options: { highlightColor } }) => [
                    style.getColor(highlightColor),
                    '!important',
                ],
            },
            saveButton: {
                backgroundColor: ({ options: { highlightColor } }) => [
                    style.getColor(highlightColor),
                    '!important',
                ],
                color: ({ options: { textColor } }) => [
                    style.getColor(textColor),
                    '!important',
                ],
                float: 'right',
            },
            addFilterButton: {
                borderColor: ({ options: { highlightColor } }) => [
                    style.getColor(highlightColor),
                    '!important',
                ],
                border: '1px solid',
            },
            highlight: {
                backgroundColor: ({ options: { highlightColor } }) => [
                    style.getColor(highlightColor),
                    '!important',
                ],
            },
            icons: {
                color: ({ options: { highlightColor } }) => [
                    style.getColor(highlightColor),
                    '!important',
                ],
            },
            filter: {
                border: '1px solid',
                borderRadius: ({ options: { borderRadius } }) => borderRadius,
                borderColor: ({ options: { borderColor } }) => [
                    style.getColor(borderColor),
                    '!important',
                ],
                padding: '15px',
                marginTop: '15px',
                marginBottom: '15px',
                position: 'relative',
                backgroundColor: ({ options: { backgroundColor } }) => [
                    style.getColor(backgroundColor),
                    '!important',
                ],
            },
            filterInput: {
                width: '33%',
            },
            operator: {
                position: 'absolute',
                height: '25px',
                margin: '0px',
                bottom: '15px',
                right: '15px',
            },
            deleteGroup: {
                position: 'absolute',
                margin: '0px',
                top: '0.6rem',
                right: '0.5rem',
            },
            pristine: {
                borderWidth: '0.0625rem',
                borderColor: '#AFB5C8',
                borderStyle: 'dashed',
                backgroundColor: '#F0F1F5',
                display: ['flex', '!important'],
                justifyContent: ['center', '!important'],
                alignItems: 'center',
                height: ['2.5rem', '!important'],
                fontSize: '0.75rem',
                color: '#262A3A',
                textTransform: 'uppercase',
            },
        };
    },
}))();
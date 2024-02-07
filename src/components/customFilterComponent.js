(() => ({
  name: 'Filter',
  type: 'CONTAINER_COMPONENT',
  allowedTypes: [],
  orientation: 'HORIZONTAL',
  jsx: (() => {
    const { env, Icon, getProperty } = B;
    const {
      MenuItem,
      TextField,
      Button,
      ButtonGroup,
      IconButton,
      Checkbox,
    } = window.MaterialUI.Core;
    const { DateFnsUtils } = window.MaterialUI;
    const {
      MuiPickersUtilsProvider,
      KeyboardDatePicker,
      KeyboardDateTimePicker,
    } = window.MaterialUI.Pickers;

    const {
      modelId,
      propertyWhiteList,
      propertyBlackList,
      actionVariableId: name,
    } = options;
    const isDev = env === 'dev';
    const { properties } = !isDev ? artifact : { properties: {} };
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
        label: 'Equals',
        kinds: ['*'],
      },
      {
        operator: 'neq',
        label: 'Does not equal',
        kinds: ['*'],
      },
      {
        operator: 'ex',
        label: 'Exists',
        kinds: ['*'],
      },
      {
        operator: 'nex',
        label: 'Does not exist',
        kinds: ['*'],
      },
      {
        operator: 'starts_with',
        label: 'Starts with',
        kinds: [...stringKinds],
      },
      {
        operator: 'ends_with',
        label: 'Ends with',
        kinds: [...stringKinds],
      },
      {
        operator: 'matches',
        label: 'Contains',
        kinds: [...stringKinds],
      },
      {
        operator: 'does_not_match',
        label: 'Does not contain',
        kinds: [...stringKinds],
      },
      {
        operator: 'gt',
        label: 'Greater than',
        kinds: [...numberKinds],
      },
      {
        operator: 'lt',
        label: 'Lower than',
        kinds: [...numberKinds],
      },
      {
        operator: 'gteq',
        label: 'Greater than or equals',
        kinds: [...numberKinds],
      },
      {
        operator: 'lteq',
        label: 'Lower than or equals',
        kinds: [...numberKinds],
      },
      {
        operator: 'gt',
        label: 'Is after',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
      {
        operator: 'lt',
        label: 'Is before',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
      {
        operator: 'gteg',
        label: 'Is after or at',
        kinds: [...dateKinds, ...dateTimeKinds],
      },
      {
        operator: 'lteq',
        label: 'Is before or at',
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

    const filterProps = (properties, id, parent = '') => {
      return Object.values(properties).filter((prop) => {
        return (
          // Add all properties besides the forbidden
          (prop.modelId === id && !forbiddenKinds.includes(prop.kind)) &&
          // Prevent circular reference shopItems->shoppingCart->shopItems
          (parent === '' || parent !== prop.id)
        );
      });
    };

    const filterOperators = (kind = '') => {
      if (!kind) return operatorList;
      return operatorList.filter((op) => {
        return op.kinds.includes(kind) || op.kinds.includes('*');
      });
    };



    const makeFilterChild = (prop, op, right) => {
      // The prop is stored as a string with a dot notation that represents the path to the property

      const constructObject = (prop, value) => {
        // Construct an object from a string with dot notation
        // Example: 'user.name' => { user: { name: value } }
        const keys = prop.split('.');
        const last = keys.pop();
        const newObj = {};
        let current = newObj;
        keys.forEach((key) => {
          current[key] = {};
          current = current[key];
        });
        current[last] = value;
        return newObj;
      };

      switch (op) {
        case 'ex':
          return constructObject(prop, {
            exists: true,
          });
        case 'nex':
          return constructObject(prop, {
            does_not_exist: 0,
          });
        default:
          return constructObject(prop, {
            [op]: right,
          });
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
                if (typeof subnode.propertyValue === 'string') {
                  const propertyInfo = getProperty(subnode.propertyValue);
                  // Use the id  of the property to get its information
                  // Get the name of the property from the propertyInfo
                  const propertyName = propertyInfo.name;

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

    const updateRowProperty = (rowId, propertyToUpdate, newValue) => {
      return groups.map((group) => {
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

    const mapWhitelist = (input = '') => {
      const lines = input.split(',');
      const result = {};

      lines.forEach(line => {
        if (line.trim() === '') return;
        const properties = line.trim().split('.');
        let currentObject = result;
        properties.forEach((property, index) => {
          if (!currentObject[property]) {
            if (index === properties.length - 1) {
              // Last property, set to true
              currentObject[property] = true;
            } else {
              // Not the last property, create a new level
              currentObject[property] = {};
            }
          }
          currentObject = currentObject[property];
        });
      });

      return result;
    }


    const mapProperties = (properties, id, iteration, whitelist = {}, parent = '') => {
      if (iteration === undefined) iteration = 0;
      if (iteration > 5) return [];

      let filteredProps = filterProps(properties, id, parent);
      if (Object.keys(whitelist).length > 0) {
        filteredProps = filteredProps.filter((prop) => !whitelist || whitelist[prop.name])
      }

      const tree = filteredProps
        .filter((prop) => {
          // Prevent recursion by checking if the inverse association is not the same as the parent
          return parent === '' || parent !== prop.inverseAssociationId;
        })
        .map((prop) => {
          if ((prop.kind === 'belongs_to' || prop.kind === 'has_many') && iteration !== 5) {
            const props = mapProperties(properties, prop.referenceModelId, iteration + 1, whitelist ? whitelist[prop.name] : undefined, prop.id);
            return {
              ...prop,
              properties: props,
            }

          }
          return {
            ...prop,
            properties: [],
          }
        })
        .sort((a, b) => {
          // Locale compare to sort alphabetically
          return a.label.localeCompare(b.label);
        });
      return tree;
    }

    const filterMappedProperties = (properties = [], id = "") => {
      // Always return the first property if no id is given
      if (id === "") return properties[0];
      return properties.find(prop => prop.id === id);
    }


    const getSelectedProperty = (rowId = "") => {
      if (!rowId) return null;
      // Get the row object
      const rowObject = groups
        .map(group => group.rows)
        .flat()
        .find(row => row.rowId === rowId);
      if (!rowObject) throw new Error(`Row with id '${rowId}' not found`)
      // Get the current property id
      const propertyValue = getRowPropertyValue(rowObject, -1);
      // Get the property information
      const prop = getProperty(propertyValue);

      return prop;
    }

    const getRowPropertyValue = (row = { propertyValue: "" }, level = 0) => {
      if (!row) return null;
      const arr = row.propertyValue.split('.')
      // Return the last element if level is -1
      if (level === -1) return arr[arr.length - 1];
      return arr[level];
    }

    const PropertySelector = ({
      properties = [],
      selectedProp = "",
      rowId = "",
      level = 0,
    }) => {

      const onChange = (event) => {
        handleChangeLeftValueInput(event.target.value, properties, rowId, level);
      }

      return (
        <TextField
          defaultValue=""
          value={selectedProp}
          classes={{ root: classes.textFieldHighlight }}
          size="small"
          variant="outlined"
          style={{ marginRight: '10px', width: '100%' }}
          onChange={onChange}
          select
        >
          {
            properties.map(({ id, label, properties }) => {
              const appendix = properties.length > 0 ? ' »' : '';
              return (
                <MenuItem key={id} value={id}>
                  {label + appendix}
                </MenuItem>
              );
            })
          }
        </TextField>
      )
    };

    const getRow = (rowId) => {
      return groups
        .map(group => group.rows)
        .flat()
        .find(row => row.rowId === rowId);
    }

    const handleChangeLeftValueInput = (value, properties, rowId, level) => {
      // Get the property from the value (id) in the properties array
      const property = properties.find(prop => prop.id === value);
      // Get the row object
      const row = getRow(rowId)
      // Split the current value
      let currentValue = row.propertyValue.split('.');
      // Set the value of the current level
      currentValue[level] = property.id;

      if (currentValue.length > level + 1) {
        // Remove all values after the current level
        currentValue = currentValue.slice(0, level + 1);
      }

      currentValue = currentValue.join('.');

      setGroups(
        updateRowProperty(
          row.rowId,
          'propertyValue',
          currentValue,
        ),
      );
    }

    const LeftValueInput = ({ properties, rowId, level = 0 }) => {
      const row = getRow(rowId);
      // Get the current property id
      const rowPropertyValue = getRowPropertyValue(row, level)
      // Get the property information
      const prop = filterMappedProperties(properties, rowPropertyValue);

      return (
        <>
          <PropertySelector
            properties={properties}
            selectedProp={prop ? prop.id : ""}
            rowId={rowId}
            level={level}
          />
          {
            prop && prop.properties.length > 0 &&
            <LeftValueInput properties={prop.properties} rowId={rowId} level={level + 1} />
          }
        </>
      )
    };

    const OperatorSwitch = ({ rowId }) => {
      const prop = getSelectedProperty(rowId);
      if (!prop) return null;

      const row = getRow(rowId);
      if (!row) return null;

      return (
        <TextField
          size="small"
          value={row.operator}
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '30rem' }}
          fullWidth
          variant="outlined"
          select
          onChange={(e) => {
            setGroups(
              updateRowProperty(
                rowId,
                'operator',
                e.target.value,
              ),
            );
          }}
        >
          {
            filterOperators(prop ? prop.kind : '')
              .map(({ operator, label }) => {
                return (
                  <MenuItem key={operator} value={operator}>
                    {label}
                  </MenuItem>
                );
              })
          }
        </TextField>
      )
    }

    const handleChangeRightValueInput = (e) => {
      const { row, type } = e.target.dataset;

      const updateGroups = (newRightValue) => {
        setGroups(
          updateRowProperty(row, 'rightValue', newRightValue)
        );
      };

      // Debounce the input with a timeout of 500ms
      if (type === 'date') {
        const d = new Date(e);
        const dateValue = d.toISOString().split('T')[0];
        updateGroups(dateValue);
      } else if (type === 'boolean') {
        const checked = e.target.checked;
        updateGroups(checked);
      } else if (type === 'number') {
        const value = e.target.value;
        let newRightValue = Number(value);
        updateGroups(newRightValue);
      } else {
        const value = e.target.value;
        let newRightValue = value;
        updateGroups(newRightValue);
      }
    }

    const RightValueInput = React.memo(({ rowId }) => {
      const prop = getSelectedProperty(rowId);
      const row = getRow(rowId);
      const [rightValue, setRightValue] = useState(row.rightValue);

      if (!prop) return null;

      const isNumberType = numberKinds.includes(prop.kind);
      const isDateType = dateKinds.includes(prop.kind) || dateTimeKinds.includes(prop.kind);
      const isBooleanType = booleanKinds.includes(prop.kind);
      const isListType = prop.kind === 'list';
      const isSpecialType = row.operator === 'ex' || row.operator === 'nex';

      if (isSpecialType) {
        return null;
      }

      if (isNumberType) {
        return (
          <TextField
            size="small"
            value={rightValue}
            classes={{ root: classes.textFieldHighlight }}
            style={{ width: '100%' }}
            type="number"
            fullWidth
            variant="outlined"
            onChange={handleChangeRightValueInput}
            inputProps={{
              'data-row': rowId,
              'data-type': 'number',
            }}
          />
        )
      }

      if (isDateType) {
        return (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDatePicker
              margin="none"
              classes={{
                toolbar: classes.datePicker,
                daySelected: classes.datePicker,
                root: classes.textFieldHighlight,
              }}
              size="small"
              value={rightValue === '' ? null : rightValue}
              initialFocusedDate={new Date()}
              style={{ width: '100%', margin: '0px' }}
              variant="inline"
              inputVariant="outlined"
              format="dd-MM-yyyy"
              inputProps={{
                'data-row': rowId,
                'data-type': 'number',
              }}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
              onKeyDown={(e) => {
                e.preventDefault();
              }}
              allowKeyboardControl={false}
              onChange={handleChangeRightValueInput}
            />
          </MuiPickersUtilsProvider>
        )
      }

      if (isBooleanType) {
        return (
          <Checkbox
            checked={rightValue}
            classes={{ root: classes.checkBox }}
            inputProps={{
              'data-row': rowId,
              'data-type': 'checkbox',
            }}
            onChange={handleChangeRightValueInput}
          />
        )
      }

      if (isListType) {
        return (
          <TextField
            select
            size="small"
            value={rightValue}
            classes={{ root: classes.textFieldHighlight }}
            style={{ width: '100%' }}
            type={inputType()}
            fullWidth
            variant="outlined"
            inputProps={{
              'data-row': rowId,
              'data-type': 'list',
            }}
            onChange={handleChangeRightValueInput}
          >
            {selectedProp.values.map(({ value }) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
        )
      }

      // Return default text input
      return (
        <TextField
          size="small"
          value={rightValue
          }
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '100%' }}
          type='text'
          fullWidth
          variant="outlined"
          inputProps={{
            'data-row': rowId,
            'data-type': 'text',
          }}
          onChange={handleChangeRightValueInput}
        />
      )

    });


    const FilterRow = ({ rowId, removeable }) => {
      console.log("FilterRow gets rendered")
      if (!modelId) return <p>Please select a model</p>;
      const row = getRow(rowId);

      const mappedWhiteList = mapWhitelist(propertyWhiteList);
      const mappedProperties = mapProperties(properties, modelId, 0, mappedWhiteList);

      useEffect(() => {
        // Set the default property value
        if (row.propertyValue === '') {
          const defaultProperty = mappedProperties[0];
          setGroups(
            updateRowProperty(
              row.rowId,
              'propertyValue',
              defaultProperty.id,
            ),
          );
        }
      }, [mappedProperties])

      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <div style={{ display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <LeftValueInput properties={mappedProperties} rowId={row.rowId} />
            </div>
            {/* Align operator switch to the right */}
            <OperatorSwitch rowId={row.rowId} />
            <RightValueInput key={makeId()} rowId={row.rowId} />
            {removeable && (
              <IconButton
                aria-label="delete"
                onClick={() => {
                  setGroups(deleteFilter(groups, row.rowId));
                }}
              >
                <Icon name="Delete" fontSize="small" />
              </IconButton>
            )}
          </div>
        </div >

      );
    };

    const FilterRowDev = () => {
      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <TextField
            select
            size="small"
            variant="outlined"
            style={{ marginRight: '10px', width: '33%', pointerEvents: 'none' }}
          />
          <TextField
            size="small"
            select
            variant="outlined"
            style={{ marginRight: '10px', width: '15%', pointerEvents: 'none' }}
          />
          <TextField
            size="small"
            type="text"
            style={{ width: '33%', pointerEvents: 'none' }}
            variant="outlined"
          />
          <IconButton aria-label="delete" style={{ pointerEvents: 'none' }}>
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

    const AddFilterRowButton = ({ node }) => {

      const handleAddGroup = (e) => {
        e.preventDefault();
        setGroups(addFilter(groups, node.id));
      }
      return (
        <Button
          type="button"
          style={{ textTransform: 'none', pointerEvents: isDev ? 'none' : 'all' }}
          onClick={handleAddGroup}
        >
          <Icon name="Add" fontSize="small" />
          Add filter row
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

    const AndOrOperatorSwitch = ({ node, dev }) => {
      return (
        <ButtonGroup size="small" className={classes.operator} style={{ pointerEvents: isDev ? 'none' : 'all' }}>
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
            and
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
            or
          </Button>
        </ButtonGroup>
      );
    };

    const handleDeleteGroup = (e) => {
      e.preventDefault();
      const groupId = e.currentTarget.getAttribute('data-value');
      const newGroups = deleteGroup(groups, groupId);
      setGroups(newGroups);
    }

    const handleSetGroupsOperator = (e) => {
      e.preventDefault();
      const newGroupsOperator = e.currentTarget.getAttribute('data-value');
      setGroupsOperator(newGroupsOperator);
    }

    const RenderGroups = () => {
      console.log('RenderGroups is rendering')
      return (
        <>
          <input
            type="hidden"
            name={name}
            value={encodeURI(JSON.stringify(filter))}
          />
          {groups.map((group, index) => (
            <>
              <div key={group.id} className={classes.filter}>
                {groups.length > 1 && (
                  <div className={classes.deleteGroup}>
                    <IconButton
                      type="button"
                      onClick={handleDeleteGroup}
                      data-value={group.id}
                      title="Delete group"
                    >
                      <Icon name="Delete" fontSize="small" />
                    </IconButton>
                  </div>
                )}
                <AndOrOperatorSwitch node={group} dev={isDev} />
                {
                  isDev ? <FilterRowDev /> : group.rows.map((row, i) => {
                    return (
                      <>
                        {
                          i > 0 && <hr />
                        }
                        <FilterRow rowId={row.rowId} removeable={group.rows.length > 0} key={row.rowId} />
                      </>
                    )
                  })
                }
                <AddFilterRowButton node={group} />
              </div>
              {index + 1 < groups.length && (
                <ButtonGroup size="small" style={{ pointerEvents: isDev ? 'none' : 'all' }}>
                  <Button
                    disableElevation
                    variant="contained"
                    color={groupsOperator === '_and' ? 'primary' : 'default'}
                    classes={{ containedPrimary: classes.highlight }}
                    onClick={handleSetGroupsOperator}
                    data-value="_and"
                  >
                    and
                  </Button>
                  <Button
                    disableElevation
                    variant="contained"
                    color={groupsOperator === '_or' ? 'primary' : 'default'}
                    classes={{ containedPrimary: classes.highlight }}
                    onClick={handleSetGroupsOperator}
                    data-value="_or"
                  >
                    or
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
        console.info('Applying filter... Please wait');
        handleApplyFilter();
      } catch (exception) {
        console.error(
          'An error occurred while applying the filter:',
          exception,
        );
      }
    });

    const handleApplyFilter = () => {

      const newFilter = makeFilter(groups);

      console.info('Filter for datatable ready! Output:');
      console.info(newFilter);


      B.triggerEvent('onSubmit', newFilter);
    };

    return (
      <div className={classes.root} >
        <RenderGroups />
      </div>
    )
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

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
      Grid,
      Select,
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
            selectedProperties: [],
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

    const filterProps = (properties, id, optional = '') => {
      return Object.values(properties).filter((prop) => {
        return (
          // Add all properties besides the forbidden
          (prop.modelId === id && !forbiddenKinds.includes(prop.kind))
        );
      });
    };

    const filterOperators = (kind, operators) => {
      if (!kind) return operators;
      return operators.filter((op) => {
        return op.kinds.includes(kind) || op.kinds.includes('*');
      });
    };



    const makeFilterChild = (prop, op, right) => {
      switch (op) {
        case 'ex':
          if (typeof prop !== 'object') {
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
                },
              },
            };
          }
        case 'nex':
          if (typeof prop !== 'object') {
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
                },
              },
            };
          }
        default:
          if (typeof prop !== 'object') {
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
                },
              },
            };
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


    const mapProperties = (properties, id, iteration, whitelist = {}) => {
      if (iteration === undefined) iteration = 0;
      if (iteration > 5) return [];

      let filteredProps = filterProps(properties, id);
      if (Object.keys(whitelist).length > 0) {
        filteredProps = filteredProps.filter((prop) => !whitelist || whitelist[prop.name])
      }
      const tree = filteredProps
        .map((prop) => {
          if ((prop.kind === 'belongs_to' || prop.kind === 'has_many') && iteration !== 5) {
            const props = mapProperties(properties, prop.referenceModelId, iteration + 1, whitelist ? whitelist[prop.name] : undefined);
            return {
              id: prop.id,
              kind: prop.kind,
              label: prop.label,
              name: prop.name,
              properties: props,
              referenceModelId: prop.referenceModelId,
            }

          }
          return {
            id: prop.id,
            kind: prop.kind,
            label: prop.label,
            name: prop.name,
            properties: [],
            referenceModelId: prop.referenceModelId,
          }
        })
      return tree;
    }

    const PropertySelector = ({ properties = [], handleChange = (value) => { return console.error("handleChange is not defined") }, depth = 0 }) => {
      const [value, setValue] = useState(properties[0].id);

      const onChange = (event) => {
        setValue(event.target.value);
        handleChange(event.target.value);
      }

      return (
        <TextField
          defaultValue=""
          value={value}
          classes={{ root: classes.textFieldHighlight }}
          size="small"
          variant="outlined"
          style={{ marginRight: '10px', width: '100%' }}
          onChange={onChange}
          select
          data-depth={depth}
        >
          {
            // This is left as a javascript component instad of a JSX component
            // because the JSX component did not trigger the onChange event
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

    const PropertyGrid = ({ properties, row }) => {
      const [selectedProp, setSelectedProp] = useState(null);

      const handleChange = (value) => {
        const property = properties.find((prop) => prop.id === value);
        setSelectedProp(property);
      }

      return (
        <>
          <PropertySelector properties={properties} handleChange={handleChange} />
          {
            selectedProp && (selectedProp.properties.length > 0) &&
            <PropertyGrid properties={selectedProp.properties} row={row} />
          }
        </>
      )
    };

    const OperatorSwitch = ({ row }) => {
      return (
        <TextField
          size="small"
          value={row.operator}
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '100%' }}
          fullWidth
          variant="outlined"
          select
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
          {
            operatorList
              .filter(() => {
                // TODO: Filter operators based on the property type
                return true
              })
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

    const FilterRow = ({ row, removeable }) => {
      if (!modelId) return <p>Please select a model</p>;

      const selectedProp = row.propertyValue && getProperty(row.propertyValue);

      const isNumberType = selectedProp && numberKinds.includes(selectedProp.kind);
      const isDateType = selectedProp && dateKinds.includes(selectedProp.kind);
      const isDateTimeType = selectedProp && dateTimeKinds.includes(selectedProp.kind);
      const isBooleanType = selectedProp && booleanKinds.includes(selectedProp.kind);
      const isSpecialType = row.operator === 'ex' || row.operator === 'nex';
      const isTextType = selectedProp && !isNumberType &&
        !isSpecialType && !isBooleanType && !isDateTimeType && !isDateType;

      const mappedWhiteList = mapWhitelist(propertyWhiteList);
      console.log("FilterRow ~ mappedWhiteList:", mappedWhiteList)
      const mappedProperties = mapProperties(properties, modelId, 0, mappedWhiteList);
      console.log("FilterRow ~ mappedProperties:", mappedProperties)

      return (
        <div key={row.rowId} style={{ width: '100%', marginBottom: '10px' }}>
          <div style={{ display: 'flex' }}>
            <PropertyGrid properties={mappedProperties} row={row} />
            <OperatorSwitch row={row} isNumberType={isNumberType} />
            {isTextType && (
              <TextField
                size="small"
                value={row.rightValue}
                classes={{ root: classes.textFieldHighlight }}
                style={{ width: '100%' }}
                type={isNumberType ? 'number' : 'text'}
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
                  format="dd-MM-yyyy HH:mm"
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
          </div >
        </div >
      );
    };

    const FilterRowDev = () => {
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

    const AddFilterRowButton = ({ node, dev }) => {

      const handleAddGroup = (e) => {
        e.preventDefault();
        setGroups(addFilter(groups, node.id));
      }
      return (
        <Button
          type="button"
          disabled={dev}
          style={{ textTransform: 'none' }}
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

    const RenderTree = ({ tree }) => {

      return (
        <>
          <input
            type="hidden"
            name={name}
            value={encodeURI(JSON.stringify(filter))}
          />
          {tree.map((node, index) => (
            <>
              <div key={node.id} className={classes.filter}>
                {tree.length > 1 && (
                  <div className={classes.deleteGroup}>
                    <IconButton
                      type="button"
                      onClick={handleDeleteGroup}
                      data-value={node.id}
                      title="Delete group"
                    >
                      <Icon name="Delete" fontSize="small" />
                    </IconButton>
                  </div>
                )}
                <AndOrOperatorSwitch node={node} dev={isDev} />
                {
                  isDev ? <FilterRowDev /> : node.rows.map((row, i) => <FilterRow row={row} removeable={i !== 0} />)
                }
                <AddFilterRowButton node={node} dev={isDev} />
              </div>
              {index + 1 < tree.length && (
                <ButtonGroup size="small" disabled={isDev}>
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
      const readableFilter = makeReadableFilter(groups);
      console.info('Readable filter ready! Output:');
      console.info(readableFilter);

      setFilter(readableFilter);

      const newFilter = makeFilter(groups);

      console.info('Filter for datatable ready! Output:');
      console.info(newFilter);

      B.triggerEvent('onSubmit', newFilter);
    };

    return (
      <div className={classes.root} >
        <RenderTree tree={groups} />
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

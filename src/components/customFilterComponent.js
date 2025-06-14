(() => ({
  name: 'Filter',
  type: 'CONTAINER_COMPONENT',
  allowedTypes: [],
  orientation: 'HORIZONTAL',
  jsx: (() => {
    const { env, Icon, getProperty } = B;
    const { MenuItem, TextField, Button, ButtonGroup, IconButton, Checkbox } =
      window.MaterialUI.Core;
    const { DateFnsUtils } = window.MaterialUI;
    const {
      MuiPickersUtilsProvider,
      KeyboardDatePicker,
      KeyboardDateTimePicker,
    } = window.MaterialUI.Pickers;

    const {
      modelId,
      addFilterRowText,
      ANDText,
      ORText,
      propertyWhiteList,
      propertyBlacklist,
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

    const [actionFilter, setActionFilter] = useState(null);

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
    const forbiddenKinds = ['password', 'multi_image', 'multi_file'];
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
      ]);
    });
    const handleSetFilterGroups = useCallback((newGroups) => {
      setGroups(newGroups);
    }, []);

    B.defineFunction('Reset advanced filter', () => {
      handleSetFilterGroups(initialState);
    });

    const filterProps = (properties, id, inverseId = '') =>
      Object.values(properties).filter(
        (prop) =>
          // Add all properties besides the forbidden
          prop.modelId === id &&
          !forbiddenKinds.includes(prop.kind) &&
          (inverseId === '' || inverseId !== prop.id),
      );

    const filterOperators = (kind = '') => {
      if (!kind) return operatorList;
      return operatorList.filter(
        (op) => op.kinds.includes(kind) || op.kinds.includes('*'),
      );
    };

    const makeFilterChild = (prop, op, right) => {
      // The prop is stored as a string with a dot notation that represents the path to the property
      console.log({ prop, op, right });

      const constructObject = (p, value) => {
        // Construct an object from a string with dot notation
        // Example: 'user.name' => { user: { name: value } }
        const array = p.split('.');
        return array.reduceRight((acc, key) => ({ [key]: acc }), value);
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

    const makeFilter = (tree) => ({
      where: {
        [groupsOperator]: tree.map((node) => ({
          [node.operator]: node.rows.map((subnode) =>
            makeFilterChild(
              subnode.propertyValue,
              subnode.operator,
              subnode.rightValue,
            ),
          ),
        })),
      },
    });

    function makeReadableFilter(f) {
      const { where } = f;
      const { _and, _or } = where;
      const groups = _and || _or;

      const translateKeys = (row) => {
        const result = {};
        const key = Object.keys(row)[0];
        const value = row[key];

        if (typeof value === 'object') {
          const { name } = getProperty(key);
          result[name] = translateKeys(value);
        } else {
          result[key] = value;
        }

        return result;
      };

      const newGroups = [];

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const operator = Object.keys(group)[0];
        const newGroup = {
          ...group,
        };
        for (let j = 0; j < group[operator].length; j++) {
          const row = { ...newGroup[operator][j] };
          const translated = translateKeys(row);
          newGroup[operator][j] = {
            ...translated,
          };
        }

        newGroups[i] = newGroup;
      }

      const result = {
        where: {
          [groupsOperator]: newGroups,
        },
      };
      console.log('After translation:', result);

      return result;
    }

    const updateGroupProperty = (groupId, groups, propertyToUpdate, newValue) =>
      groups.map((group) => {
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

    const deleteFilter = (group, rowId) =>
      group.map((group) => {
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

    const mapList = (input = '') => {
      const lines = input.split(',');
      const result = {};

      lines.forEach((line) => {
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
    };

    const mapProperties = (
      properties,
      id,
      iteration,
      whitelist = {},
      blacklist = {},
      parent = '',
    ) => {
      if (iteration === undefined) iteration = 0;
      if (iteration > 5) return [];

      let filteredProps = filterProps(properties, id, parent);
      if (Object.keys(whitelist).length > 0) {
        filteredProps = filteredProps.filter(
          (prop) => !whitelist || whitelist[prop.name],
        );
      }

      if (Object.keys(blacklist).length > 0) {
        filteredProps = filteredProps.filter((prop) => !blacklist[prop.name]);
      }

      const tree = filteredProps
        .filter(
          (prop) =>
            // Prevent recursion by checking if the inverse association is not the same as the parent
            parent === '' || parent !== prop.inverseAssociationId,
        )
        .map((prop) => {
          if (
            (prop.kind === 'belongs_to' || prop.kind === 'has_many') &&
            iteration !== 5
          ) {
            const props = mapProperties(
              properties,
              prop.referenceModelId,
              iteration + 1,
              whitelist ? whitelist[prop.name] : undefined,
              blacklist,
              prop.id,
            );
            return {
              ...prop,
              properties: props,
            };
          }
          return {
            ...prop,
            properties: [],
          };
        })
        .sort((a, b) =>
          // Locale compare to sort alphabetically
          a.label.localeCompare(b.label),
        );
      return tree;
    };

    const filterMappedProperties = (properties = [], id = '') => {
      // Always return the first property if no id is given
      if (id === '') return properties[0];
      return properties.find((prop) => prop.id === id);
    };

    function PropertySelector({
      properties = [],
      onChange = () => undefined,
      selectedProperty = '',
    }) {
      return (
        <TextField
          defaultValue=""
          value={selectedProperty}
          classes={{ root: classes.textFieldHighlight }}
          size="small"
          variant="outlined"
          style={{ marginRight: '10px', width: '100%' }}
          onChange={onChange}
          select
          name={`property-${selectedProperty}`}
        >
          {properties.map(({ id, label, properties }) => {
            const appendix = properties.length > 0 ? ' »' : '';
            return (
              <MenuItem key={id} value={id}>
                {label + appendix}
              </MenuItem>
            );
          })}
        </TextField>
      );
    }

    const getGroup = (groupId) => groups.find((group) => group.id === groupId);

    const getLeftValue = (leftValue, level = 0) => {
      const value = leftValue.split('.');
      return value[level];
    };

    function LeftValueInput({
      properties = [],
      level = 0,
      setRowPropertyValue = (value = '', properties = [], level = 0) => {},
      leftValue = '',
    }) {
      const [value, setValue] = useState(getLeftValue(leftValue, level));
      const prop = filterMappedProperties(properties, value);

      useEffect(() => {
        if (level > 0 && properties.length > 0 && value === undefined) {
          setValue(properties[0].id);
        }
      }, []);

      const onChange = (e) => {
        const { value } = e.target;
        setValue(value);
        setRowPropertyValue(value, properties, level);
      };

      return (
        <>
          <PropertySelector
            properties={properties}
            selectedProperty={value}
            onChange={onChange}
          />
          {prop && prop.properties.length > 0 && (
            <LeftValueInput
              properties={prop.properties}
              level={level + 1}
              setRowPropertyValue={setRowPropertyValue}
              leftValue={leftValue}
            />
          )}
        </>
      );
    }

    function OperatorSwitch({
      prop = '',
      setOperatorValue = () => {},
      operator: value = 'eq',
    }) {
      const operators = filterOperators(prop ? prop.kind : '');
      const [operator, setOperator] = useState(value);

      const onChange = (e) => {
        const { value } = e.target;
        setOperator(value);
        setOperatorValue(value);
      };

      return (
        <TextField
          size="small"
          value={operator}
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '30rem' }}
          fullWidth
          variant="outlined"
          select
          onChange={onChange}
        >
          {operators.map(({ operator, label }) => (
            <MenuItem key={operator} value={operator}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    function RightValueInput({
      prop,
      operator,
      setRightValue = (value) => {},
      rightValue: value = '',
    }) {
      if (operator === 'ex' || operator === 'nex') {
        return <></>;
      }

      const [rightValue, setRightValueState] = useState(value);

      const handleBlur = (e) => {
        setRightValue(rightValue);
      };
      const isNumberType = numberKinds.includes(prop.kind);
      const isDateType = dateKinds.includes(prop.kind);
      const isDateTimeType = dateTimeKinds.includes(prop.kind);
      const isBooleanType = booleanKinds.includes(prop.kind);
      const isListType = prop.kind === 'list';
      const isSpecialType = operator === 'ex' || operator === 'nex';

      const handleChange = (e) => {
        const { type } = e.target.dataset;

        if (type === 'date') {
          const d = new Date(e);
          const newRightValue = d.toISOString().split('T')[0];
          setRightValueState(newRightValue);
        } else if (type === 'checkbox') {
          const newRightValue = e.target.checked;
          setRightValueState(newRightValue);
          setRightValue(newRightValue);
        } else if (type === 'number') {
          const { value } = e.target;
          const newRightValue = Number(value);
          setRightValueState(newRightValue);
        } else {
          const { value } = e.target;
          const newRightValue = value;
          setRightValueState(newRightValue);
        }
      };

      const handleChangeDate = (date, type = 'date') => {
        let newRightValue = '';
        if (type === 'date') {
          newRightValue = date.toISOString().split('T')[0];
        } else {
          newRightValue = date.toISOString();
        }
        setRightValueState(newRightValue);
      };

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
            onChange={handleChange}
            onBlur={handleBlur}
            inputProps={{
              'data-type': 'number',
            }}
          />
        );
      }

      if (isDateType) {
        // Set default value for date
        if (rightValue === '') {
          const today = new Date();
          setRightValue(today.toISOString().split('T')[0]);
          // Trigger onBlur to bring inital value to the row
        }

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
              ampm={false}
              inputVariant="outlined"
              format="dd-MM-yyyy"
              inputProps={{
                'data-type': 'number',
              }}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
              allowKeyboardControl
              onChange={(date) => {
                handleChangeDate(date, 'date');
              }}
              onBlur={handleBlur}
            />
          </MuiPickersUtilsProvider>
        );
      }

      if (isDateTimeType) {
        // Set default value for date
        if (rightValue === '') {
          const today = new Date();
          setRightValue(today.toISOString());
        }

        return (
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <KeyboardDateTimePicker
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
              ampm={false}
              inputVariant="outlined"
              format="dd-MM-yyyy HH:mm"
              inputProps={{
                'data-type': 'number',
              }}
              KeyboardButtonProps={{
                'aria-label': 'change date',
              }}
              allowKeyboardControl
              onChange={(date) => handleChangeDate(date, 'dateTime')}
              onBlur={handleBlur}
            />
          </MuiPickersUtilsProvider>
        );
      }

      if (isBooleanType) {
        // Set default value for boolean
        if (rightValue === '') {
          setRightValue(false);
        }

        return (
          <Checkbox
            checked={rightValue}
            classes={{ root: classes.checkBox }}
            inputProps={{
              'data-type': 'checkbox',
            }}
            onChange={handleChange}
          />
        );
      }

      if (isListType) {
        // Set default value for list
        if (rightValue === '' && prop.values.length > 0) {
          setRightValue(prop.values[0].value);
        }
        return (
          <TextField
            select
            size="small"
            value={rightValue}
            classes={{ root: classes.textFieldHighlight }}
            style={{ width: '100%' }}
            fullWidth
            variant="outlined"
            inputProps={{
              'data-type': 'list',
            }}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            {prop.values.map(({ value }) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </TextField>
        );
      }

      // Return standard text input by default
      return (
        <TextField
          size="small"
          value={rightValue}
          classes={{ root: classes.textFieldHighlight }}
          style={{ width: '100%' }}
          type="text"
          fullWidth
          variant="outlined"
          inputProps={{
            'data-type': 'text',
          }}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      );
    }

    const updateRow = (rowId, newRow) => {
      const newGroups = groups.map((group) => {
        const newGroup = group;
        newGroup.rows = group.rows.map((row) => {
          if (row.rowId === rowId) {
            return newRow;
          }
          return row;
        });
        return newGroup;
      });

      handleSetFilterGroups(newGroups);
    };

    function FilterRow({ row = {}, removeable = false }) {
      if (!modelId) return <p>Please select a model</p>;

      const mappedWhiteList = mapList(propertyWhiteList);
      const mappedBlackList = mapList(propertyBlacklist);
      const mappedProperties = mapProperties(
        properties,
        modelId,
        0,
        mappedWhiteList,
        mappedBlackList,
      );

      const [filter, setFilter] = useState(row);

      // Set default value for propertyValue
      if (row.propertyValue === '' && mappedProperties.length > 0) {
        row.propertyValue = mappedProperties[0].id;
      }

      useEffect(() => {
        if (!filter) return;
        if (filter === row) return;
        updateRow(row.rowId, filter);
      }, [filter]);

      const setPropertyValue = (
        propertyValue = '',
        properties = [],
        level = 0,
      ) => {
        const property = filterMappedProperties(properties, propertyValue);
        // Split the current value
        let currentValue = filter.propertyValue.split('.');
        // Set the value of the current level
        currentValue[level] = propertyValue;

        if (property.kind === 'belongs_to' || property.kind === 'has_many') {
          // If the property is a relation, add a default level
          currentValue[level + 1] = properties[0].id;
        }

        if (currentValue.length > level + 1) {
          // Remove all values after the current level
          currentValue = currentValue.slice(0, level + 1);
        }

        currentValue = currentValue.join('.');
        const newFilter = {
          ...filter,
          propertyValue: currentValue,
          rightValue: '', // Reset the right value when the property changes
        };
        setFilter(newFilter);
      };

      const setOperatorValue = (operator) => {
        const newFilter = { ...filter, operator };
        setFilter(newFilter);
      };

      const setRightValue = (rightValue) => {
        const newFilter = { ...filter, rightValue };
        setFilter(newFilter);
      };

      const deleteRow = (e) => {
        e.preventDefault();
        handleSetFilterGroups(deleteFilter(groups, row.rowId));
      };

      const amountOfLevels = filter.propertyValue.split('.').length;
      const currentProperty = getProperty(
        filter.propertyValue.split('.')[amountOfLevels - 1],
      );

      return (
        <div style={{ width: '100%', marginBottom: '10px' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: '100%',
              }}
            >
              <LeftValueInput
                properties={mappedProperties}
                setRowPropertyValue={setPropertyValue}
                leftValue={row.propertyValue}
              />
            </div>
            <OperatorSwitch
              prop={currentProperty}
              setOperatorValue={setOperatorValue}
              operator={row.operator}
            />
            <RightValueInput
              prop={currentProperty}
              setRightValue={setRightValue}
              rightValue={row.rightValue}
              operator={row.operator}
            />
            {removeable && (
              <IconButton aria-label="delete" onClick={deleteRow}>
                <Icon name="Delete" fontSize="small" />
              </IconButton>
            )}
          </div>
        </div>
      );
    }

    function FilterRowDev() {
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
    }

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

    function AddFilterRowButton({ group }) {
      const handleAddGroup = (e) => {
        e.preventDefault();

        handleSetFilterGroups(addFilter(groups, group.id));
      };
      return (
        <Button
          type="button"
          style={{
            textTransform: 'none',
            pointerEvents: isDev ? 'none' : 'all',
          }}
          onClick={handleAddGroup}
        >
          <Icon name="Add" fontSize="small" />
          {addFilterRowText || 'Add filter row'}
        </Button>
      );
    }

    const deleteGroup = (tree, groupId) => {
      const newTree = tree.slice();
      const foundIndex = newTree.findIndex((g) => g.id === groupId);

      if (foundIndex > -1) {
        newTree.splice(foundIndex, 1);
      }
      return newTree;
    };

    function AndOrOperatorSwitch({ groupId }) {
      const group = getGroup(groupId);

      const handleOnClick = (e) => {
        const operator = e.currentTarget.getAttribute('data-value');
        handleSetFilterGroups(
          updateGroupProperty(group.id, groups, 'operator', operator),
        );
      };
      return (
        <ButtonGroup
          size="small"
          className={classes.operator}
          style={{ pointerEvents: isDev ? 'none' : 'all' }}
        >
          <Button
            disableElevation
            variant="contained"
            classes={{ containedPrimary: classes.highlight }}
            color={group.operator === '_and' ? 'primary' : 'default'}
            data-value="_and"
            onClick={handleOnClick}
          >
            {ANDText || 'and'}
          </Button>
          <Button
            disableElevation
            variant="contained"
            classes={{ containedPrimary: classes.highlight }}
            color={group.operator === '_or' ? 'primary' : 'default'}
            onClick={handleOnClick}
            data-value="_or"
          >
            {ORText || 'or'}
          </Button>
        </ButtonGroup>
      );
    }

    const handleDeleteGroup = (e) => {
      e.preventDefault();
      const groupId = e.currentTarget.getAttribute('data-value');
      const newGroups = deleteGroup(groups, groupId);
      handleSetFilterGroups(newGroups);
    };

    const handleSetGroupsOperator = (e) => {
      e.preventDefault();
      const newGroupsOperator = e.currentTarget.getAttribute('data-value');
      setGroupsOperator(newGroupsOperator);
    };

    function RenderGroups({ groups }) {
      const mapRows = (group) =>
        group.rows.map((row, i) => (
          <>
            {i > 0 && <hr />}
            <FilterRow
              row={row}
              removeable={group.rows.length > 1}
              key={`filter-row-${row.rowId}`}
            />
          </>
        ));

      return (
        <>
          <input
            type="hidden"
            name={name}
            value={JSON.stringify(actionFilter)}
          />
          {groups.map((group, index) => (
            <div key={`group-${group.id}`}>
              <div className={classes.filter}>
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
                <AndOrOperatorSwitch groupId={group.id} />
                <div style={{ marginTop: groups.length > 1 ? '30px' : '' }}>
                  {isDev ? <FilterRowDev /> : mapRows(group)}
                </div>
                <AddFilterRowButton group={group} />
              </div>
              {index + 1 < groups.length && (
                <ButtonGroup
                  size="small"
                  style={{ pointerEvents: isDev ? 'none' : 'all' }}
                >
                  <Button
                    disableElevation
                    variant="contained"
                    color={groupsOperator === '_and' ? 'primary' : 'default'}
                    classes={{ containedPrimary: classes.highlight }}
                    onClick={handleSetGroupsOperator}
                    data-value="_and"
                  >
                    {ANDText || 'and'}
                  </Button>
                  <Button
                    disableElevation
                    variant="contained"
                    color={groupsOperator === '_or' ? 'primary' : 'default'}
                    classes={{ containedPrimary: classes.highlight }}
                    onClick={handleSetGroupsOperator}
                    data-value="_or"
                  >
                    {ORText || 'or'}
                  </Button>
                </ButtonGroup>
              )}
            </div>
          ))}
        </>
      );
    }

    const handleApplyFilter = () => {
      const dataTableFilter = makeFilter(groups);
      console.log({ dataTableFilter, groups });
      B.triggerEvent('onSubmit', dataTableFilter);
      const filterForAction = makeReadableFilter(makeFilter(groups));
      console.log({ filterForAction });
      setActionFilter(filterForAction);
    };

    B.defineFunction('Apply filter', () => {
      try {
        handleApplyFilter();
      } catch (exception) {
        console.error(
          'An error occurred while applying the filter:',
          exception,
        );
      }
    });

    return (
      <div className={classes.root}>
        <RenderGroups key="render-group" groups={groups} />
      </div>
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
        margin: '0px',
        position: 'absolute',
        top: '0',
        right: '0',
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

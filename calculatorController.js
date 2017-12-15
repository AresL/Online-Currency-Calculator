angular.module("calculator", []).controller("myCtrl", function($scope, $http) {
	const MAX_LENGTH_HISTORY = 30;
	const MAX_LENGTH_RESULT = 31;
	
	function Input(){
		this.history_str = "";	//Used to store 1d operation strings
		this.result_str = "0";
		this.used = false;	//Prevents spam of op key
		this.read_only = true;	//Leads to overwrite if input is given
		this.get_value = () => parseFloat(this.result_str);
	};
	
	function Operation(){
		
		this.error = undefined	//Flag used to indicate attempt to divide by 0	
		, this.memory = ""
		, this.result = {	
			history: "",	//Completed operations
			value: 0
		}
		, this.operator = {	//Current operator
			text: "",
			func: undefined
		}
		, this.input = new Input()
		, this.get_history = () => this.error ? '' : (this.result.history + this.operator.text + this.input.history_str).slice( (-1) * MAX_LENGTH_HISTORY)
		, this.get_result = () => this.error ? this.error.slice( (-1) * MAX_LENGTH_RESULT ) : this.input.result_str.slice( (-1) * MAX_LENGTH_RESULT)
		, this.execute_operation = () =>{
			
			//Execute operation
			this.operator.func ? this.result.value = this.operator.func(this) : this.result.value = this.input.get_value();
			
			//Store operation
			this.operator.func ? this.result.history += this.operator.text + (this.input.history_str || this.input.result_str) : this.result.history = (this.input.history_str || this.input.result_str);
			
			//Delete input
			this.input.history_str = "";
			this.input.result_str = "" + this.result.value;
			this.input.used = true;
			this.input.read_only = true;
		}
		, this.complete = () => {	//It is used when '=' is pressed
		
			//Initialize new Input
			let result_str = this.input.result_str;
			this.input = new Input;
			this.input.result_str = result_str;
			
			
			this.result = {	
				history: "",	//Completed operations
				value: 0
			}
			this.operator = {
				text: "",
				func: undefined
			}
		}
		, this.setNumber = (number) => {
			if(!this.error){	//If an error exist, do nothing
				
				//Unused data exists
				this.input.used = false;
				
				if(number=='.' || number==','){
					//If this is the first character added
					if(this.input.read_only){
						this.input.read_only = false;
						this.input.result_str = "0.";
						}
					//If this is not the first char added
					else{
						if(this.input.result_str.indexOf('.') == -1){
							this.input.result_str += '.';
						}
						//Else do nothing
					}
				}
				
				//This is a number added
				else{
					if(this.input.read_only){
						this.input.read_only = false;
						this.input.result_str = "" + number;
					}
					else{
						this.input.result_str += number;
					}
				}
			}
		}
		, this.setSingleOp = (op_func) => {
			
			if(!this.error){	//If an error exist, do nothing
				op_func(this);
				this.input.read_only = true;
				this.input.used = false;
			}
		}
		, this.setDoubleOp = (op_func) => {
			
			if(!this.error){	//If an error exist, do nothing
				
				if(!this.input.used){
					//Execute pending operations
					this.execute_operation();
				}
				
				op_func(this.operator);
			}
		}
		, this.setDataOp = (op_func) => {
			
			if(!this.error){	//If an error exist, do nothing
				op_func(this);
			}
		}
		, this.setMemoryOp = (op_func) => {
			
			if(!this.error){	//If an error exist, do nothing
				op_func(this);
			}
		}
		, this.setConvertOp = (op_func) => {
			
			if(!this.error){	//If an error exist, do nothing
				op_func(this);
			}
		}
		
	};
	
	let operation = new Operation();
	
	$scope.history = '';
	$scope.result = '0';
	$scope.current_currencies = {
		currency_1: "EUR"
		, currency_2: "USD"
		, currency_1_rate: "?"
		, currency_2_rate: "?"
	};
	$scope.currency_list = ["AUD",
		"BGN",
		"BRL",
		"CAD",
		"CHF",
		"CNY",
		"CZK",
		"DKK",
		"EUR",
		"GBP",
		"HKD",
		"HRK",
		"HUF",
		"IDR",
		"ILS",
		"INR",
		"JPY",
		"KRW",
		"MXN",
		"MYR",
		"NOK",
		"NZD",
		"PHP",
		"PLN",
		"RON",
		"RUB",
		"SEK",
		"SGD",
		"THB",
		"TRY",
		"USD",
		"ZAR"];
	$scope.getRates = function(){
		$http.get(`https://api.fixer.io/latest?base=${$scope.current_currencies['currency_1']}`)
		.then( (response) => {
			console.log("Recieved response");
			let rate = response.data.rates[$scope.current_currencies['currency_2']];
			$scope.current_currencies['currency_1_rate'] = rate.toFixed(3);
			if(rate!=0){
				$scope.current_currencies['currency_2_rate'] = (1/rate).toFixed(3);
			}
			else{
				$scope.current_currencies['currency_2_rate'] = 0;
			}
			console.log(`1 ${$scope.current_currencies['currency_1']} = ${JSON.stringify(rate)} ${$scope.current_currencies['currency_2']}`);
		}, () => {
			$scope.error_msg = "Unable to load currencies";
		});
	};
	$scope.pressKey = function(input_type, keyValue){
		
		if(!operation || operation.error){
			console.log("An Error has occured. Construction of new Operation.");
			operation = new Operation();
		}
		
		let input_types = {
			number: (keyValue) => {
				//If keyValue is a number or '.'
				if( ( parseInt(keyValue)>=0 && parseInt(keyValue)<10 ) || keyValue=='.' || keyValue==',' ){
					operation.setNumber(keyValue);
				}
				else{
					console.log("invalid input: " + keyValue);
				}
			},
			single_op: (keyValue) => {
				
				//This Object contains all 1-number operations
				let ops = {
					"squared": (operation) => {
						operation.input.history_str = `sqr(${(operation.input.history_str || operation.input.result_str)})`;
						operation.input.result_str = "" + Math.pow(operation.input.get_value(), 2);
					},
					"reverse": (operation) => {
						if(operation.input.get_value() == 0){
							operation.error = "ERROR: Unable to divide by 0" 
						}
						else{
							operation.input.history_str = `reverse(${(operation.input.history_str || operation.input.result_str)})`;
							operation.input.result_str = "" + 1/operation.input.get_value();
						}
					},
					"negate": (operation) => {
						operation.input.history_str = `negate(${(operation.input.history_str || operation.input.result_str)})`;
						operation.input.result_str = "" + (-1) * operation.input.get_value();
					},
					"%": (operation) => {
						let result = operation.result.value/100 * operation.input.get_value();
						operation.input.history_str = `${result}`;
						operation.input.result_str = `${result}`;
					},
					"sqrt": (operation) => {
						if(operation.input.get_value() >= 0){
							operation.input.history_str = `(root ${(operation.input.history_str || operation.input.result_str)})`;
							operation.input.result_str = `${Math.sqrt(operation.input.get_value())}`;
						}
						else{
							operation.error = "ERROR: Invalid input"
						}
					},
					"=": (operation) => {
						operation.execute_operation();
						operation.complete();
					},
					
				};
				operation.setSingleOp(ops[keyValue]);
			},
			double_op: (keyValue) => {
				
				//This Object contains all 2-numbers operations
				let ops = {
					"+": (operator) => {
						operator.text = ` + `;
						operator.func = (operation) => operation.result.value += operation.input.get_value();
					},
					"-": (operator) => {
						operator.text = ` - `;
						operator.func = (operation) => operation.result.value -= operation.input.get_value();
					},
					"times": (operator) => {
						operator.text = ` * `;
						operator.func = (operation) => operation.result.value *= operation.input.get_value();
					},
					"divide": (operator) => {
						operator.text = `/ `;
						operator.func = (operation) => 
							(operation.input.get_value() == 0) ? operation.error = "ERROR: Unable to divide by 0" : operation.result.value /= operation.input.get_value();
					},
				};
				operation.setDoubleOp(ops[keyValue]);
			},
			data_op: (keyValue) => {
				let ops = {
					//Data manipulation keys
					"CE": (operation) => {
						operation.input.history_str = "";
						operation.input.result_str = "0";
						operation.input.read_only = true;
					},
					"C": (operation) => {
						
						operation.result = {	
							history: "",
							value: 0
						}
						operation.input = new Input;
						operation.operator = {
							text: "",
							func: undefined
						}
					},
					"Backspace": (operation) => {
						
						if(!operation.input.read_only){
							//If this is a single digit number, set to 0
							if(operation.input.result_str.length == 1){
								operation.input.result_str = '0';
								operation.input.read_only = true;
							}
							else{
								operation.input.result_str = operation.input.result_str.slice(0, -1);
							}
						}
					}
				};
				operation.setDataOp(ops[keyValue]);
			},
			memory_op: (keyValue) => {
				let ops = {
					"MC": (operation) => {
						operation.memory = 0;
					},
					"MR": (operation) => {
						operation.input.history_str = "";
						operation.input.result_str = "" + operation.memory;
						
						if(operation.memory == 0){
							operation.input.read_only = true;
						}
						
					},
					"M+": (operation) => {
						operation.memory += operation.input.get_value();
					},
					"M-": (operation) => {
						operation.memory -= operation.input.get_value();
					},
					"MS": (operation) => {
						operation.memory = operation.input.get_value();
					}
				};
				operation.setMemoryOp(ops[keyValue]);
			},
			convert: ( {from: from_currency, to: to_currency, rate: rate} ) => {
				console.log(`Converting from ${from_currency} to ${to_currency} (1 ${from_currency} = ${rate} ${to_currency})`);
				let op = (operation) => {
					operation.input.history_str = `${from_currency}_to_${to_currency}(${operation.input.history_str || operation.input.result_str})`;
					operation.input.result_str = "" + (operation.input.get_value() * rate).toFixed(2);;
					operation.used = false;
					operation.read_only = true;
				};
				
				operation.setConvertOp(op);
			}
		}
		
		input_types[input_type](keyValue);
		
		$scope.history = operation.get_history();
		$scope.result = operation.get_result();
	}

	//Default rates initialization
	$scope.getRates();
	
});

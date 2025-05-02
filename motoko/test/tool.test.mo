import Tool "../src/tool";
import { test } "mo:test";

test(
    "create simple tool",
    func() {
        let tool = (Tool.ToolBuilder("test_tool")).build();

        let expected = #function({
            name = "test_tool";
            description = null;
            parameters = null;
        });

        assert tool == expected;
    },
);

test(
    "tool with description",
    func() {
        let tool = (Tool.ToolBuilder("test_tool"))
            .withDescription("This is a test tool")
            .build();

        let expected = #function({
            name = "test_tool";
            description = ?"This is a test tool";
            parameters = null;
        });

        assert tool == expected;
    },
);

test(
    "tool with single parameter",
    func() {
        let tool = (Tool.ToolBuilder("test_tool"))
            .withParameter(
                (Tool.ParameterBuilder("param1", #String))
                    .withDescription("Test parameter")
                    .isRequired()
            )
            .build();

        let expected = #function({
            name = "test_tool";
            description = null;
            parameters = ?{
                type_ = "object";
                properties = ?[{
                    name = "param1";
                    type_ = "string";
                    description = ?"Test parameter";
                    enum_ = null;
                }];
                required = ?["param1"];
            };
        });

        assert tool == expected;
    },
);

test(
    "tool with multiple parameters",
    func() {
        let tool = (Tool.ToolBuilder("weather_tool"))
            .withDescription("Get weather information")
            .withParameter(
                (Tool.ParameterBuilder("location", #String))
                    .withDescription("City name")
                    .isRequired()
            )
            .withParameter(
                (Tool.ParameterBuilder("units", #String))
                    .withDescription("Temperature units")
            )
            .withParameter(
                (Tool.ParameterBuilder("forecast", #Boolean))
                    .withDescription("Include forecast")
            )
            .build();

        let expected = #function({
            name = "weather_tool";
            description = ?"Get weather information";
            parameters = ?{
                type_ = "object";
                properties = ?[
                    {
                        name = "location";
                        type_ = "string";
                        description = ?"City name";
                        enum_ = null;
                    },
                    {
                        name = "units";
                        type_ = "string";
                        description = ?"Temperature units";
                        enum_ = null;
                    },
                    {
                        name = "forecast";
                        type_ = "boolean";
                        description = ?"Include forecast";
                        enum_ = null;
                    },
                ];
                required = ?["location"];
            };
        });

        assert tool == expected;
    },
);

test(
    "optional parameter",
    func() {
        let tool = (Tool.ToolBuilder("test_tool"))
            .withParameter(
                (Tool.ParameterBuilder("optional_param", #String))
                    .withDescription("This parameter is optional")
            )
            .build();

        let expected = #function({
            name = "test_tool";
            description = null;
            parameters = ?{
                type_ = "object";
                properties = ?[{
                    name = "optional_param";
                    type_ = "string";
                    description = ?"This parameter is optional";
                    enum_ = null;
                }];
                required = null;
            };
        });

        assert tool == expected;
    },
);

test(
    "parameter type conversion",
    func() {
        assert Tool.parameterTypeToText(#String) == "string";
        assert Tool.parameterTypeToText(#Boolean) == "boolean";
        assert Tool.parameterTypeToText(#Number) == "number";
    },
);

test(
    "weather tool example",
    func() {
        let weather_tool = (Tool.ToolBuilder("get_current_weather"))
            .withDescription("Get current weather for a location.")
            .withParameter(
                (Tool.ParameterBuilder("location", #String))
                    .withDescription("The location to get the weather for (e.g. Cairo, Egypt)")
                    .isRequired()
            )
            .build();

        let expected = #function({
            name = "get_current_weather";
            description = ?"Get current weather for a location.";
            parameters = ?{
                type_ = "object";
                properties = ?[{
                    name = "location";
                    type_ = "string";
                    description = ?"The location to get the weather for (e.g. Cairo, Egypt)";
                    enum_ = null;
                }];
                required = ?["location"];
            };
        });

        assert weather_tool == expected;
    },
);

test(
    "number parameter",
    func() {
        let tool = (Tool.ToolBuilder("calculator"))
            .withDescription("Perform mathematical calculations")
            .withParameter(
                (Tool.ParameterBuilder("value", #Number))
                    .withDescription("The numeric value to use in calculation")
                    .isRequired()
            )
            .build();

        let expected = #function({
            name = "calculator";
            description = ?"Perform mathematical calculations";
            parameters = ?{
                type_ = "object";
                properties = ?[{
                    name = "value";
                    type_ = "number";
                    description = ?"The numeric value to use in calculation";
                    enum_ = null;
                }];
                required = ?["value"];
            };
        });

        assert tool == expected;
    },
);

test(
    "enum parameter",
    func() {
        let tool = (Tool.ToolBuilder("unit_converter"))
            .withDescription("Convert between different units")
            .withParameter(
                (Tool.ParameterBuilder("value", #Number))
                    .withDescription("The value to convert")
                    .isRequired()
            )
            .withParameter(
                (Tool.ParameterBuilder("unit", #String))
                    .withDescription("The unit to convert to")
                    .withEnumValues(["meters", "feet", "kilometers", "miles"])
                    .isRequired()
            )
            .build();

        let expected = #function({
            name = "unit_converter";
            description = ?"Convert between different units";
            parameters = ?{
                type_ = "object";
                properties = ?[
                    {
                        name = "value";
                        type_ = "number";
                        description = ?"The value to convert";
                        enum_ = null;
                    },
                    {
                        name = "unit";
                        type_ = "string";
                        description = ?"The unit to convert to";
                        enum_ = ?["meters", "feet", "kilometers", "miles"];
                    },
                ];
                required = ?["value", "unit"];
            };
        });

        assert tool == expected;
    },
);

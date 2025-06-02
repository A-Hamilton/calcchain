import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Collapse,
  Snackbar,
  Alert,
  AlertColor,
  MenuItem,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  InputAdornment,
  FormHelperText,
} from "@mui/material";
import {
  InfoOutlined as InfoOutlinedIcon,
  Tune as TuneIcon,
  RestartAlt as RestartAltIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Calculate as CalculateIcon,
  AutoFixHigh as AutoFixHighIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import { m, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { fetchCandles, getAtrPerMin, Candle } from "../utils/atr";
import { computeOptimalGridParams } from "../utils/optimizer";
import { GridParameters, GridType, EntryType } from "../types";
import { DEFAULT_ATR_PERIOD } from "../constants";

// Enhanced form field types with better validation
type FormFields = {
  symbol: string;
  principal: string;
  lowerBound: string;
  upperBound: string;
  gridCount: string;
  leverage: string;
  feePercent: string;
  durationDays: string;
  buyPrice: string;
  sellPrice: string;
  gridType: GridType;
  entryType: EntryType;
};

type FieldConfig = {
  key: keyof FormFields;
  label: string;
  type: "number" | "text" | "select";
  help: string;
  options?: GridType[] | EntryType[];
  adornment?: string;
  group?: string;
  icon?: React.ReactNode;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
  };
};

export interface InputFormProps {
  onCalculate: (params: GridParameters) => void;
  calculationErrorFromApp?: string | null;
  onClearCalculationErrorFromApp?: () => void;
}

// Enhanced field configurations with icons and better validation
const fieldConfigs: FieldConfig[] = [
  {
    key: "symbol",
    label: "Trading Symbol",
    type: "text",
    help: "Enter a valid trading pair (e.g., BTCUSDT, ETHUSDT). Must be available on Binance.",
    group: "Asset & Investment",
    icon: <TrendingUpIcon />,
    validation: { required: true },
  },
  {
    key: "principal",
    label: "Investment Amount",
    type: "number",
    help: "Total capital in USD for this grid strategy. This will be distributed across all grid levels.",
    adornment: "$",
    group: "Asset & Investment",
    icon: <SpeedIcon />,
    validation: { required: true, min: 1 },
  },
  {
    key: "lowerBound",
    label: "Lower Price Bound",
    type: "number",
    help: "Minimum price for the grid range. Grid will place buy orders starting from this level.",
    group: "Grid Range",
    validation: { required: true, min: 0.000001 },
  },
  {
    key: "upperBound",
    label: "Upper Price Bound",
    type: "number",
    help: "Maximum price for the grid range. Grid will place sell orders up to this level.",
    group: "Grid Range",
    validation: { required: true, min: 0.000001 },
  },
  {
    key: "gridCount",
    label: "Number of Grid Lines",
    type: "number",
    help: "Total number of price levels in your grid. More grids = smaller price steps but more trades.",
    group: "Grid Configuration",
    validation: { required: true, min: 2, max: 100, step: 1 },
  },
  {
    key: "leverage",
    label: "Leverage Multiplier",
    type: "number",
    help: "Leverage ratio (1 = no leverage, 2 = 2x leverage). Higher leverage increases both potential profit and risk.",
    group: "Grid Configuration",
    validation: { required: true, min: 1, max: 125 },
  },
  {
    key: "feePercent",
    label: "Trading Fee (%)",
    type: "number",
    help: "Exchange trading fee per transaction as a percentage (e.g., 0.1 for 0.1%). Check your exchange's fee structure.",
    adornment: "%",
    group: "Strategy Details",
    validation: { required: true, min: 0, max: 5, step: 0.001 },
  },
  {
    key: "durationDays",
    label: "Strategy Duration",
    type: "number",
    help: "How many days to run the simulation. Longer periods provide more accurate profit estimates.",
    adornment: "days",
    group: "Strategy Details",
    validation: { required: true, min: 1, max: 365, step: 1 },
  },
];

const advancedFieldConfigs: FieldConfig[] = [
  {
    key: "buyPrice",
    label: "Entry Price (Optional)",
    type: "number",
    help: "Specific price to buy the entire principal if not using grid entry. Leave empty for grid-only strategy.",
    validation: { min: 0 },
  },
  {
    key: "sellPrice",
    label: "Exit Price (Optional)",
    type: "number",
    help: "Specific price to sell the entire position if not using grid exit. Leave empty for grid-only strategy.",
    validation: { min: 0 },
  },
  {
    key: "gridType",
    label: "Grid Calculation Method",
    type: "select",
    options: Object.values(GridType),
    help: "Arithmetic: Fixed price differences between levels. Geometric: Fixed percentage differences between levels.",
  },
  {
    key: "entryType",
    label: "Trading Direction",
    type: "select",
    options: Object.values(EntryType),
    help: "Long: Profit when price goes up. Short: Profit when price goes down. Neutral: Profit from both directions.",
  },
];

// Enhanced initial form with better defaults
const initialForm: FormFields = {
  symbol: "BTCUSDT",
  principal: "1000",
  lowerBound: "",
  upperBound: "",
  gridCount: "20",
  leverage: "1",
  feePercent: "0.1",
  durationDays: "30",
  buyPrice: "",
  sellPrice: "",
  gridType: GridType.Arithmetic,
  entryType: EntryType.Long,
};

// Enhanced styles with better accessibility
const textFieldSx = {
  "& .MuiInputLabel-root": {
    color: "text.secondary",
    fontWeight: 500,
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "primary.main" },
  "& .MuiOutlinedInput-root": {
    "& input": {
      color: "text.primary",
      fontWeight: 500,
    },
    "& .MuiSelect-select": {
      textAlign: "left" as const,
      color: "text.primary",
      fontWeight: 500,
      paddingRight: "52px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap" as const,
    },
    "& .MuiInputAdornment-root.MuiInputAdornment-positionStart": {
      marginRight: "8px",
      "& .MuiTypography-root": {
        color: "text.secondary",
        fontWeight: 600,
      },
    },
    "& .MuiInputAdornment-root.MuiInputAdornment-positionEnd": {
      marginLeft: "8px",
      "& .MuiTypography-root": {
        color: "text.secondary",
        fontWeight: 500,
      },
    },
    "& fieldset": {
      borderColor: "divider",
      borderWidth: "1.5px",
    },
    "&:hover fieldset": {
      borderColor: "primary.light",
    },
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: "2px",
    },
    "&.Mui-error fieldset": {
      borderColor: "error.main",
      borderWidth: "2px",
    },
  },
  "& .MuiFormHelperText-root": {
    color: "text.secondary",
    fontSize: "0.75rem",
    marginLeft: "14px",
    marginRight: "14px",
    minHeight: "1.2em",
    lineHeight: "1.4em",
    whiteSpace: "normal" as const,
    marginTop: "6px",
    "&.Mui-error": {
      color: "error.main",
      fontWeight: 500,
    },
  },
};

// Enhanced animation variants
const formItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
      type: "spring",
      stiffness: 120,
      damping: 20,
    },
  },
};

const InputForm: React.FC<InputFormProps> = ({
  onCalculate,
  calculationErrorFromApp,
  onClearCalculationErrorFromApp,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [form, setForm] = useState<FormFields>(initialForm);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormFields, string>>
  >({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [localSymbolFetchError, setLocalSymbolFetchError] = useState<
    string | null
  >(null);
  const [formTouched, setFormTouched] = useState<
    Partial<Record<keyof FormFields, boolean>>
  >({});

  // Enhanced spring animation for button interactions
  const buttonSpring = useSpring(0);
  const buttonScale = useTransform(buttonSpring, [0, 1], [1, 1.05]);

  // Enhanced validation with better error messages
  const validate = useCallback(() => {
    const nextErrors: Partial<Record<keyof FormFields, string>> = {};

    // Symbol validation
    if (!form.symbol.trim()) {
      nextErrors.symbol = "Trading symbol is required.";
    } else if (form.symbol.trim().length < 3) {
      nextErrors.symbol = "Symbol must be at least 3 characters.";
    }

    // Principal validation
    const principal = Number(form.principal);
    if (!form.principal || principal <= 0) {
      nextErrors.principal = "Investment amount must be greater than 0.";
    } else if (principal < 10) {
      nextErrors.principal = "Minimum investment amount is $10.";
    }

    // Price bounds validation
    const lower = Number(form.lowerBound);
    const upper = Number(form.upperBound);

    if (form.lowerBound && (isNaN(lower) || lower <= 0)) {
      nextErrors.lowerBound = "Must be a positive number.";
    }
    if (form.upperBound && (isNaN(upper) || upper <= 0)) {
      nextErrors.upperBound = "Must be a positive number.";
    }
    if (form.lowerBound && form.upperBound && !isNaN(lower) && !isNaN(upper)) {
      if (lower >= upper) {
        nextErrors.upperBound = "Upper bound must be greater than lower bound.";
      } else if ((upper - lower) / lower < 0.01) {
        nextErrors.upperBound =
          "Price range too narrow (minimum 1% difference).";
      }
    }

    // Grid count validation
    const gridC = Number(form.gridCount);
    if (
      form.gridCount &&
      (isNaN(gridC) || gridC <= 0 || !Number.isInteger(gridC))
    ) {
      nextErrors.gridCount = "Must be a positive integer.";
    } else if (gridC > 100) {
      nextErrors.gridCount = "Maximum 100 grid lines allowed.";
    } else if (gridC < 2) {
      nextErrors.gridCount = "Minimum 2 grid lines required.";
    }

    // Leverage validation
    const leverage = Number(form.leverage);
    if (!form.leverage || leverage < 1) {
      nextErrors.leverage = "Leverage must be at least 1.";
    } else if (leverage > 125) {
      nextErrors.leverage = "Maximum leverage is 125x.";
    }

    // Fee validation
    const fee = Number(form.feePercent);
    if (form.feePercent === "" || isNaN(fee) || fee < 0) {
      nextErrors.feePercent = "Trading fee must be 0 or greater.";
    } else if (fee > 5) {
      nextErrors.feePercent = "Fee seems unusually high (>5%).";
    }

    // Duration validation
    const duration = Number(form.durationDays);
    if (!form.durationDays || duration <= 0 || !Number.isInteger(duration)) {
      nextErrors.durationDays = "Must be a positive integer.";
    } else if (duration > 365) {
      nextErrors.durationDays = "Maximum duration is 365 days.";
    }

    // Optional fields validation
    if (
      form.buyPrice &&
      (isNaN(Number(form.buyPrice)) || Number(form.buyPrice) < 0)
    ) {
      nextErrors.buyPrice = "Must be a positive number or empty.";
    }
    if (
      form.sellPrice &&
      (isNaN(Number(form.sellPrice)) || Number(form.sellPrice) < 0)
    ) {
      nextErrors.sellPrice = "Must be a positive number or empty.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);

  useEffect(() => {
    validate();
  }, [form, validate]);

  // Enhanced form change handler with better state management
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        | HTMLInputElement
        | HTMLTextAreaElement
        | { name?: string; value: unknown }
      >,
    ) => {
      const name = e.target.name as keyof FormFields;
      const value = e.target.value as string;

      setForm((f) => ({
        ...f,
        [name]:
          name === "gridType"
            ? (value as GridType)
            : name === "entryType"
              ? (value as EntryType)
              : value,
      }));

      setFormTouched((prev) => ({ ...prev, [name]: true }));

      if (name === "symbol") {
        setLocalSymbolFetchError(null);
      }
      if (calculationErrorFromApp && onClearCalculationErrorFromApp) {
        onClearCalculationErrorFromApp();
      }
    },
    [calculationErrorFromApp, onClearCalculationErrorFromApp],
  );

  // Enhanced select value rendering
  const renderSelectValue = useCallback((selectedValue: unknown) => {
    if (typeof selectedValue !== "string") return "";
    return (
      <Typography
        component="span"
        noWrap
        sx={{
          textAlign: "left",
          color: "text.primary",
          width: "100%",
          display: "block",
          fontWeight: 500,
        }}
      >
        {selectedValue.charAt(0).toUpperCase() + selectedValue.slice(1)}
      </Typography>
    );
  }, []);

  // Stepper functionality for numerical inputs
  const handleStepperChange = useCallback(
    (field: keyof FormFields, direction: "up" | "down") => {
      const currentValue = Number(form[field]) || 0;
      const stepValue =
        field === "gridCount" ||
        field === "durationDays" ||
        field === "leverage"
          ? 1
          : field === "feePercent"
            ? 0.01
            : field === "principal"
              ? 100
              : 0.01;

      const newValue =
        direction === "up"
          ? currentValue + stepValue
          : Math.max(0, currentValue - stepValue);

      const formattedValue =
        field === "gridCount" ||
        field === "durationDays" ||
        field === "leverage"
          ? Math.round(newValue).toString()
          : newValue.toFixed(field === "feePercent" ? 2 : 2);

      setForm((prev) => ({ ...prev, [field]: formattedValue }));
      setFormTouched((prev) => ({ ...prev, [field]: true }));
    },
    [form],
  );

  // Enhanced field rendering with better accessibility and animations
  const renderField = useCallback(
    (cfg: FieldConfig, index: number) => {
      const hasError = Boolean(
        cfg.key === "symbol"
          ? localSymbolFetchError || calculationErrorFromApp || errors.symbol
          : errors[cfg.key],
      );
      const errorMessage =
        cfg.key === "symbol"
          ? localSymbolFetchError || calculationErrorFromApp || errors.symbol
          : errors[cfg.key];
      const showError = hasError && formTouched[cfg.key];

      const isNumericalField =
        cfg.type === "number" &&
        [
          "gridCount",
          "leverage",
          "feePercent",
          "principal",
          "durationDays",
        ].includes(cfg.key);

      return (
        <Grid item component="div" xs={12} sm={6} key={cfg.key}>
          <m.div
            custom={index}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <TextField
              label={cfg.label}
              name={cfg.key}
              value={form[cfg.key]}
              onChange={handleChange}
              type={cfg.type === "number" ? "number" : "text"}
              select={cfg.type === "select"}
              inputProps={{
                inputMode: cfg.type === "number" ? "decimal" : undefined,
                min: cfg.validation?.min,
                max: cfg.validation?.max,
                step:
                  cfg.validation?.step ||
                  (cfg.key === "gridCount" ||
                  cfg.key === "durationDays" ||
                  cfg.key === "leverage"
                    ? "1"
                    : "any"),
                "aria-label": cfg.label,
                "aria-describedby": `${cfg.key}-helper`,
              }}
              SelectProps={
                cfg.options
                  ? {
                      native: false,
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            maxHeight: 200,
                            "& .MuiMenuItem-root": {
                              textAlign: "left",
                              fontWeight: 500,
                              "&:hover": {
                                backgroundColor: alpha(
                                  theme.palette.primary.main,
                                  0.08,
                                ),
                              },
                            },
                          },
                        },
                      },
                      renderValue:
                        cfg.type === "select" ? renderSelectValue : undefined,
                    }
                  : undefined
              }
              sx={textFieldSx}
              variant="outlined"
              fullWidth
              margin="dense"
              error={showError}
              required={cfg.validation?.required}
              InputProps={{
                ...(cfg.adornment && {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        {cfg.adornment}
                      </Typography>
                    </InputAdornment>
                  ),
                }),
                endAdornment: (
                  <InputAdornment position="end">
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      {/* Stepper buttons for numerical fields */}
                      {isNumericalField && (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleStepperChange(cfg.key, "up")}
                            sx={{
                              minWidth: 20,
                              width: 20,
                              height: 16,
                              borderRadius: 0,
                              color: "text.secondary",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                              },
                              transition: "all 0.2s ease",
                            }}
                            aria-label={`Increase ${cfg.label}`}
                            tabIndex={-1}
                          >
                            <AddIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                          <Divider
                            sx={{ borderColor: theme.palette.divider }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleStepperChange(cfg.key, "down")}
                            sx={{
                              minWidth: 20,
                              width: 20,
                              height: 16,
                              borderRadius: 0,
                              color: "text.secondary",
                              "&:hover": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: "primary.main",
                              },
                              transition: "all 0.2s ease",
                            }}
                            aria-label={`Decrease ${cfg.label}`}
                            tabIndex={-1}
                          >
                            <RemoveIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      )}

                      <Tooltip
                        title={cfg.help}
                        placement="top"
                        arrow
                        TransitionComponent={Zoom}
                        componentsProps={{
                          tooltip: {
                            sx: {
                              maxWidth: 300,
                              fontSize: "0.75rem",
                            },
                          },
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            color: "text.secondary",
                            p: 0.5,
                            width: 28,
                            height: 28,
                            "&:hover": {
                              backgroundColor: alpha(
                                theme.palette.action.hover,
                                0.8,
                              ),
                              color: theme.palette.text.primary,
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s ease-in-out",
                          }}
                          aria-label={`Information about ${cfg.label}`}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </InputAdornment>
                ),
              }}
              FormHelperTextProps={{
                id: `${cfg.key}-helper`,
              }}
              helperText={
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  {cfg.icon && (
                    <Box sx={{ color: "text.secondary", mt: 0.25 }}>
                      {React.cloneElement(cfg.icon as React.ReactElement, {
                        fontSize: "small",
                      })}
                    </Box>
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: showError ? "error.main" : "text.secondary",
                      fontWeight: showError ? 500 : 400,
                      lineHeight: 1.4,
                    }}
                  >
                    {showError ? errorMessage : cfg.help}
                  </Typography>
                </Box>
              }
            >
              {cfg.options &&
                (cfg.options as Array<GridType | EntryType>).map((opt) => (
                  <MenuItem
                    key={opt}
                    value={opt}
                    sx={{
                      fontSize: "0.9rem",
                      textAlign: "left",
                      fontWeight: 500,
                    }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </MenuItem>
                ))}
            </TextField>
          </m.div>
        </Grid>
      );
    },
    [
      form,
      errors,
      localSymbolFetchError,
      calculationErrorFromApp,
      formTouched,
      handleChange,
      renderSelectValue,
      theme,
    ],
  );

  // Group fields for better organization
  const groupedFields = useMemo(() => {
    return fieldConfigs.reduce(
      (acc, field) => {
        const group = field.group || "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(field);
        return acc;
      },
      {} as Record<string, FieldConfig[]>,
    );
  }, []);

  // Enhanced optimization handler with better error handling
  const handleOptimize = useCallback(async () => {
    if (calculationErrorFromApp && onClearCalculationErrorFromApp) {
      onClearCalculationErrorFromApp();
    }
    setLocalSymbolFetchError(null);
    setIsOptimizing(true);

    try {
      const symbol = form.symbol.trim().toUpperCase();
      if (!symbol) {
        setLocalSymbolFetchError("Symbol is required for optimization.");
        setSnackbar({
          open: true,
          message: "Please enter a trading symbol before optimizing.",
          severity: "error",
        });
        return;
      }

      const candles: Candle[] = await fetchCandles(
        symbol,
        "1d",
        DEFAULT_ATR_PERIOD + 1,
      );
      if (!candles || candles.length === 0) {
        throw new Error(
          `No market data available for ${symbol}. Please check if the symbol is valid and listed on Binance.`,
        );
      }

      const currentPrice = candles[candles.length - 1].close;
      const investmentAmount = Number(form.principal) || 1000;
      const feePercentValue = Number(form.feePercent) || 0.1;
      const atr = await getAtrPerMin(symbol, DEFAULT_ATR_PERIOD);
      const gridTypeOpt = form.gridType;
      const userBuyPrice =
        form.buyPrice && !isNaN(Number(form.buyPrice))
          ? Number(form.buyPrice)
          : undefined;
      const userSellPrice =
        form.sellPrice && !isNaN(Number(form.sellPrice))
          ? Number(form.sellPrice)
          : undefined;

      const optimalParams = computeOptimalGridParams({
        symbol,
        currentPrice,
        principal: investmentAmount,
        atr,
        feePercent: feePercentValue,
        gridType: gridTypeOpt,
        buyPrice: userBuyPrice,
        sellPrice: userSellPrice,
      });

      const priceDecimals = currentPrice < 1 ? 6 : currentPrice < 100 ? 4 : 2;

      setForm((f) => ({
        ...f,
        symbol,
        lowerBound: optimalParams.lower.toFixed(priceDecimals),
        upperBound: optimalParams.upper.toFixed(priceDecimals),
        gridCount: optimalParams.count.toString(),
      }));

      setSnackbar({
        open: true,
        message: `Optimal parameters applied! Price range: $${optimalParams.lower.toFixed(priceDecimals)} - $${optimalParams.upper.toFixed(priceDecimals)} with ${optimalParams.count} grids.`,
        severity: "success",
      });
    } catch (err: unknown) {
      let specificMessage =
        "Failed to optimize parameters. Please check the symbol or try again.";

      if (err instanceof Error) {
        if (
          err.message.toLowerCase().includes("symbol") ||
          err.message.toLowerCase().includes("market data")
        ) {
          specificMessage = `No market data found for '${form.symbol.trim()}'. Please verify the symbol is correct and listed on Binance.`;
        } else {
          specificMessage = err.message;
        }
      } else if (typeof err === "string") {
        specificMessage = err;
      }

      setLocalSymbolFetchError(specificMessage);
      setSnackbar({
        open: true,
        message: specificMessage,
        severity: "error",
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [form, calculationErrorFromApp, onClearCalculationErrorFromApp]);

  // Enhanced form submission with better validation
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (calculationErrorFromApp && onClearCalculationErrorFromApp) {
        onClearCalculationErrorFromApp();
      }
      setLocalSymbolFetchError(null);

      // Mark all fields as touched for validation display
      const allTouched = Object.keys(form).reduce(
        (acc, key) => {
          acc[key as keyof FormFields] = true;
          return acc;
        },
        {} as Partial<Record<keyof FormFields, boolean>>,
      );
      setFormTouched(allTouched);

      if (!validate()) {
        setSnackbar({
          open: true,
          message: "Please correct the highlighted errors before calculating.",
          severity: "error",
        });
        return;
      }

      const params: GridParameters = {
        symbol: form.symbol.trim().toUpperCase(),
        principal: Number(form.principal),
        lowerBound: Number(form.lowerBound),
        upperBound: Number(form.upperBound),
        gridCount: Number(form.gridCount),
        leverage: Number(form.leverage),
        feePercent: Number(form.feePercent),
        durationDays: Number(form.durationDays),
        buyPrice:
          form.buyPrice && !isNaN(Number(form.buyPrice))
            ? Number(form.buyPrice)
            : undefined,
        sellPrice:
          form.sellPrice && !isNaN(Number(form.sellPrice))
            ? Number(form.sellPrice)
            : undefined,
        gridType: form.gridType,
        entryType: form.entryType,
        atrPeriod: DEFAULT_ATR_PERIOD,
      };

      onCalculate(params);
    },
    [
      form,
      calculationErrorFromApp,
      onClearCalculationErrorFromApp,
      validate,
      onCalculate,
    ],
  );

  // Enhanced form reset
  const handleResetForm = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setFormTouched({});
    setLocalSymbolFetchError(null);
    if (calculationErrorFromApp && onClearCalculationErrorFromApp) {
      onClearCalculationErrorFromApp();
    }
    setSnackbar({
      open: true,
      message: "Form has been reset to default values.",
      severity: "info",
    });
  }, [calculationErrorFromApp, onClearCalculationErrorFromApp]);

  const isCalculateDisabled = useMemo(() => {
    return (
      Object.keys(errors).length > 0 ||
      Boolean(localSymbolFetchError) ||
      Boolean(calculationErrorFromApp) ||
      isOptimizing ||
      !form.symbol.trim() ||
      !form.principal ||
      !form.lowerBound ||
      !form.upperBound
    );
  }, [
    errors,
    localSymbolFetchError,
    calculationErrorFromApp,
    isOptimizing,
    form,
  ]);

  return (
    <m.div variants={cardVariants} initial="hidden" animate="visible">
      <Card
        sx={{
          bgcolor: "background.paper",
          p: { xs: 1.5, md: 2 },
          borderRadius: theme.shape.borderRadius,
          boxShadow:
            theme.palette.mode === "light"
              ? theme.shadows[2]
              : `0px 8px 32px ${alpha("#000000", 0.24)}`,
          border: `1px solid ${theme.palette.divider}`,
          position: "relative",
          overflow: "visible",
        }}
        role="form"
        aria-label="Grid trading parameters form"
      >
        <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
          {/* Enhanced header with better visual hierarchy */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2.5,
              pb: 1,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TuneIcon sx={{ color: "primary.main", fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                color="primary.main"
                sx={{
                  fontWeight: 600,
                  fontSize: "1.2rem",
                }}
              >
                Grid Parameters
              </Typography>
            </Box>
            <Tooltip title="Reset to default values" arrow>
              <IconButton
                onClick={handleResetForm}
                size="small"
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    color: "error.main",
                    backgroundColor: alpha(theme.palette.error.main, 0.08),
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
                aria-label="Reset form to default values"
              >
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Enhanced info alert */}
          <Box sx={{ mb: 3 }}>
            <Alert
              icon={<AutoFixHighIcon fontSize="inherit" />}
              severity="info"
              variant="outlined"
              sx={{
                borderColor: alpha(theme.palette.info.main, 0.3),
                bgcolor: alpha(theme.palette.info.main, 0.05),
                color:
                  theme.palette.mode === "light"
                    ? theme.palette.info.dark
                    : theme.palette.info.light,
                "& .MuiAlert-icon": {
                  color: theme.palette.info.main,
                },
                "& .MuiAlert-message": {
                  fontSize: "0.85rem",
                  fontWeight: 500,
                },
              }}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  💡 Pro Tip
                </Typography>
                <Typography variant="body2">
                  Not sure about the optimal values? Click{" "}
                  <strong>"Optimize Values"</strong> to get AI-powered
                  suggestions based on current market data and volatility
                  patterns.
                </Typography>
              </Box>
            </Alert>
          </Box>

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            {/* Enhanced grouped fields with better visual separation */}
            {Object.entries(groupedFields).map(
              ([groupName, fieldsInGroup], groupIndex) => (
                <m.div
                  key={groupName}
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.07,
                        delayChildren: groupIndex * 0.1,
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      mb:
                        groupIndex === Object.keys(groupedFields).length - 1
                          ? 2.5
                          : 3.5,
                    }}
                  >
                    <m.div variants={formItemVariants} custom={0}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1.5,
                          mt: groupIndex === 0 ? 0.5 : 2.5,
                        }}
                      >
                        <Box
                          sx={{
                            width: 3,
                            height: 20,
                            bgcolor: "primary.main",
                            borderRadius: 1,
                          }}
                        />
                        <Typography
                          variant="overline"
                          display="block"
                          sx={{
                            color: "text.primary",
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {groupName}
                        </Typography>
                      </Box>
                    </m.div>
                    <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }}>
                      {fieldsInGroup.map((field, fieldIdx) =>
                        renderField(field, fieldIdx),
                      )}
                    </Grid>
                  </Box>
                </m.div>
              ),
            )}

            {/* Enhanced action buttons */}
            <Box
              sx={{
                mt: 3,
                pt: 1,
                display: "flex",
                gap: { xs: 1.5, sm: 2 },
                flexDirection: { xs: "column", sm: "row" },
              }}
            >
              <Button
                component={m.button}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  transition: { duration: 0.2, type: "spring", stiffness: 300 },
                }}
                whileTap={{ scale: 0.98 }}
                variant="outlined"
                color="primary"
                onClick={handleOptimize}
                sx={{
                  flexGrow: 1,
                  minHeight: 48,
                  fontSize: { xs: "0.875rem", md: "0.95rem" },
                  fontWeight: 600,
                  borderWidth: "2px",
                  "&:hover": {
                    borderWidth: "2px",
                  },
                }}
                type="button"
                disabled={isOptimizing || !form.symbol.trim()}
                startIcon={
                  isOptimizing ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AutoFixHighIcon />
                  )
                }
                aria-label="Optimize trading parameters using AI"
              >
                {isOptimizing ? "Optimizing..." : "Optimize Values"}
              </Button>

              <Button
                component={m.button}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  boxShadow: `0px 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transition: { duration: 0.2, type: "spring", stiffness: 300 },
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                variant="contained"
                color="primary"
                sx={{
                  flexGrow: 1,
                  minHeight: 48,
                  fontSize: { xs: "0.875rem", md: "0.95rem" },
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  "&:hover": {
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                  "&:disabled": {
                    background: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                }}
                disabled={isCalculateDisabled}
                startIcon={<CalculateIcon />}
                aria-label="Calculate grid trading profits"
              >
                Calculate Results
              </Button>
            </Box>

            {/* Enhanced advanced settings */}
            <Box sx={{ mt: 2.5, textAlign: "right" }}>
              <Button
                onClick={() => setAdvancedOpen((x) => !x)}
                color="primary"
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
                endIcon={
                  <m.div
                    animate={{ rotate: advancedOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TuneIcon fontSize="small" />
                  </m.div>
                }
                type="button"
                aria-expanded={advancedOpen}
                aria-controls="advanced-settings"
              >
                {advancedOpen
                  ? "Hide Advanced Settings"
                  : "Show Advanced Settings"}
              </Button>

              <AnimatePresence>
                {advancedOpen && (
                  <m.div
                    id="advanced-settings"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <Divider sx={{ my: 2, opacity: 0.5 }} />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 500, mb: 1, display: "block" }}
                    >
                      Advanced Configuration
                    </Typography>
                    <Grid
                      container
                      spacing={{ xs: 1.5, sm: 2, md: 2 }}
                      sx={{ mt: 0 }}
                    >
                      {advancedFieldConfigs.map((field, idx) =>
                        renderField(field, idx + fieldConfigs.length),
                      )}
                    </Grid>
                  </m.div>
                )}
              </AnimatePresence>
            </Box>
          </form>

          {/* Enhanced snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            TransitionComponent={Fade}
          >
            <Alert
              onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
              severity={snackbar.severity}
              sx={{
                width: "100%",
                boxShadow: 6,
                fontWeight: 500,
                ...(snackbar.severity === "success" && {
                  bgcolor: theme.palette.success.main,
                  color: theme.palette.success.contrastText,
                  "& .MuiAlert-icon": {
                    color: theme.palette.success.contrastText,
                  },
                }),
                ...(snackbar.severity === "info" && {
                  bgcolor: theme.palette.info.main,
                  color: theme.palette.info.contrastText,
                  "& .MuiAlert-icon": {
                    color: theme.palette.info.contrastText,
                  },
                }),
                ...(snackbar.severity === "error" && {
                  bgcolor: theme.palette.error.main,
                  color: theme.palette.error.contrastText,
                  "& .MuiAlert-icon": {
                    color: theme.palette.error.contrastText,
                  },
                }),
                ...(snackbar.severity === "warning" && {
                  bgcolor: theme.palette.warning.main,
                  color: theme.palette.warning.contrastText,
                  "& .MuiAlert-icon": {
                    color: theme.palette.warning.contrastText,
                  },
                }),
              }}
              variant="filled"
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    </m.div>
  );
};

export default React.memo(InputForm);

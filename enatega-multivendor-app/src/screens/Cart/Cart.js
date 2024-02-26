/* eslint-disable indent */
import React, {
  useState,
  useEffect,
  useContext,
  useLayoutEffect,
  useRef
} from 'react'
import { MaterialIcons, Entypo, Feather } from '@expo/vector-icons'
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
  Alert,
  Animated,
  Text,
  FlatList
} from 'react-native'
import { useMutation, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AntDesign, EvilIcons } from '@expo/vector-icons'
import { Placeholder, PlaceholderLine, Fade } from 'rn-placeholder'
import { Modalize } from 'react-native-modalize'
import moment from 'moment'
import CartItem from '../../components/CartItem/CartItem'
import { getTipping, orderFragment } from '../../apollo/queries'
import { placeOrder } from '../../apollo/mutations'
import { scale } from '../../utils/scaling'
import { stripeCurrencies, paypalCurrencies } from '../../utils/currencies'
import { theme } from '../../utils/themeColors'
import { alignment } from '../../utils/alignment'
import ThemeContext from '../../ui/ThemeContext/ThemeContext'
import ConfigurationContext from '../../context/Configuration'
import UserContext from '../../context/User'
import styles from './styles'
import { FlashMessage } from '../../ui/FlashMessage/FlashMessage'
import TextDefault from '../../components/Text/TextDefault/TextDefault'
import { useRestaurant } from '../../ui/hooks'
import { LocationContext } from '../../context/Location'
import EmptyCart from '../../assets/SVG/imageComponents/EmptyCart'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { DAYS } from '../../utils/enums'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { RectButton } from 'react-native-gesture-handler'
import { textStyles } from '../../utils/textStyles'
import Pickup from '../../components/Pickup'
import { calculateDistance } from '../../utils/customFunctions'
import analytics from '../../utils/analytics'
import { HeaderBackButton } from '@react-navigation/elements'
import navigationService from '../../routes/navigationService'
import { useTranslation } from 'react-i18next'
import Location from '../../components/Main/Location/Location'

// Constants
const PLACEORDER = gql`
  ${placeOrder}
`
const TIPPING = gql`
  ${getTipping}
`
// suggested Items List Data
const dataItems = [
  { id: '1', name: 'Burger', description: 'Large', price: '$20' },
  { id: '2', name: 'Burger', description: 'Small', price: '$5' },
  { id: '3', name: 'Burger', description: 'Medium', price: '$10' }
]

function Cart(props) {
  const Analytics = analytics()
  const navigation = useNavigation()
  const configuration = useContext(ConfigurationContext)
  const {
    isLoggedIn,
    profile,
    clearCart,
    restaurant: cartRestaurant,
    cart,
    cartCount,
    addQuantity,
    removeQuantity,
    deleteItem,
    updateCart
  } = useContext(UserContext)
  const themeContext = useContext(ThemeContext)
  const { location } = useContext(LocationContext)
  const currentTheme = theme[themeContext.ThemeValue]
  const { t } = useTranslation()
  const modalRef = useRef(null)
  const [loadingData, setLoadingData] = useState(true)
  const [minimumOrder, setMinimumOrder] = useState('')
  const [isPickedUp, setIsPickedUp] = useState(false)
  const [orderDate, setOrderDate] = useState(moment())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState({})
  const [deliveryCharges, setDeliveryCharges] = useState(0)

  {
    /* Check if cart is empty */
  }
  const isCartEmpty = cart.length === 0

  {
    /* If cart is not empty, store its length in a variable */
  }
  const cartLength = !isCartEmpty ? cart.length : 0
  const { loading, data } = useRestaurant(cartRestaurant)

  const { loading: loadingTip, data: dataTip } = useQuery(TIPPING, {
    fetchPolicy: 'network-only'
  })

  const onOpen = () => {
    const modal = modalRef.current
    if (modal) {
      modal.open()
      setIsModalOpen(true)
    }
  }

  const [mutateOrder, { loading: loadingOrderMutation }] = useMutation(
    PLACEORDER,
    {
      onCompleted,
      onError,
      update
    }
  )

  const COD_PAYMENT = {
    payment: 'COD',
    label: t('cod'),
    index: 2,
    icon: require('../../assets/images/cashIcon.png')
  }

  const paymentMethod =
    props.route.params && props.route.params.paymentMethod
      ? props.route.params.paymentMethod
      : COD_PAYMENT
  const coupon =
    props.route.params && props.route.params.coupon
      ? props.route.params.coupon
      : null

  const tip =
    props.route.params && props.route.params.tipAmount
      ? props.route.params.tipAmount
      : null

  const [selectedTip, setSelectedTip] = useState()
  const inset = useSafeAreaInsets()

  useEffect(() => {
    if (tip) {
      setSelectedTip(null)
    } else if (dataTip && !selectedTip) {
      setSelectedTip(dataTip.tips.tipVariations[1])
    }
  }, [tip, data])

  useEffect(() => {
    let isSubscribed = true
    ;(async () => {
      if (data && !!data.restaurant) {
        const latOrigin = Number(data.restaurant.location.coordinates[1])
        const lonOrigin = Number(data.restaurant.location.coordinates[0])
        const latDest = Number(location.latitude)
        const longDest = Number(location.longitude)
        const distance = await calculateDistance(
          latOrigin,
          lonOrigin,
          latDest,
          longDest
        )
        const amount = Math.ceil(distance) * configuration.deliveryRate
        isSubscribed &&
          setDeliveryCharges(amount > 0 ? amount : configuration.deliveryRate)
      }
    })()
    return () => {
      isSubscribed = false
    }
  }, [data, location])

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(currentTheme.themeBackground)
    }
    StatusBar.setBarStyle('dark-content')
  })

  useLayoutEffect(() => {
    props.navigation.setOptions({
      title: t('titleCart'),
      headerRight: null,
      headerTitleAlign: 'center',
      headerTitleStyle: {
        color: currentTheme.btnText,
        ...textStyles.H4,
        ...textStyles.Bolder
      },
      headerTitleContainerStyle: {
        paddingLeft: scale(25),
        paddingRight: scale(25),
        backgroundColor: currentTheme.transparent
      },
      headerStyle: {
        backgroundColor: currentTheme.themeBackground
      },
      headerLeft: () => (
        <HeaderBackButton
          truncatedLabel=""
          backImage={() => (
            <View
              style={{
                ...alignment.PLsmall,
                alignItems: 'center'
              }}>
              <AntDesign
                name="arrowleft"
                size={22}
                color={currentTheme.fontFourthColor}
              />
            </View>
          )}
          onPress={() => {
            navigationService.goBack()
          }}
        />
      )
    })
  }, [props.navigation])

  useEffect(() => {
    if (!data) return
    didFocus()
  }, [data])
  useEffect(() => {
    async function Track() {
      await Analytics.track(Analytics.events.NAVIGATE_TO_CART)
    }
    Track()
  }, [])
  useEffect(() => {
    if (cart && cartCount > 0) {
      if (
        data &&
        data.restaurant &&
        (!data.restaurant.isAvailable || !isOpen())
      ) {
        showAvailablityMessage()
      }
    }
  }, [data])

  const showAvailablityMessage = () => {
    Alert.alert(
      '',
      `${data.restaurant.name} closed at the moment`,
      [
        {
          text: 'Go back to restaurants',
          onPress: () => {
            props.navigation.navigate({
              name: 'Main',
              merge: true
            })
          },
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: () => {},
          style: 'cancel'
        }
      ],
      { cancelable: true }
    )
  }

  function update(cache, { data: { placeOrder } }) {
    try {
      if (placeOrder && placeOrder.paymentMethod === 'COD') {
        cache.modify({
          fields: {
            orders(existingOrders = []) {
              const newOrder = cache.writeFragment({
                data: placeOrder,
                fragment: gql`
                  ${orderFragment}
                `
              })
              return [newOrder, ...existingOrders]
            }
          }
        })
      }
    } catch (error) {
      console.log('update error', error)
    }
  }

  async function onCompleted(data) {
    await Analytics.track(Analytics.events.ORDER_PLACED, {
      userId: data.placeOrder.user._id,
      orderId: data.placeOrder.orderId,
      name: data.placeOrder.user.name,
      email: data.placeOrder.user.email,
      restaurantName: data.placeOrder.restaurant.name,
      restaurantAddress: data.placeOrder.restaurant.address,
      orderPaymentMethod: data.placeOrder.paymentMethod,
      orderItems: data.placeOrder.items,
      orderAmount: data.placeOrder.orderAmount,
      orderPaidAmount: data.placeOrder.paidAmount,
      tipping: data.placeOrder.tipping,
      orderStatus: data.placeOrder.orderStatus,
      orderDate: data.placeOrder.orderDate
    })
    if (paymentMethod.payment === 'COD') {
      await clearCart()
      props.navigation.reset({
        routes: [
          { name: 'Main' },
          {
            name: 'OrderDetail',
            params: { _id: data.placeOrder._id }
          }
        ]
      })
    } else if (paymentMethod.payment === 'PAYPAL') {
      console.log('here')
      props.navigation.replace('Paypal', {
        _id: data.placeOrder.orderId,
        currency: configuration.currency
      })
    } else if (paymentMethod.payment === 'STRIPE') {
      props.navigation.replace('StripeCheckout', {
        _id: data.placeOrder.orderId,
        amount: data.placeOrder.orderAmount,
        email: data.placeOrder.user.email,
        currency: configuration.currency
      })
    }
  }
  function onError(error) {
    console.log('onError', error)
    if (error.graphQLErrors.length) {
      console.log('error', JSON.stringify(error))
      FlashMessage({
        message: error.graphQLErrors[0].message
      })
    } else {
      FlashMessage({
        message: error.message
      })
    }
  }

  function calculateTip() {
    if (tip) {
      return tip
    } else if (selectedTip) {
      let total = 0
      const delivery = isPickedUp ? 0 : deliveryCharges
      total += +calculatePrice(delivery, true)
      total += +taxCalculation()
      const tipPercentage = (
        (total / 100) *
        parseFloat(selectedTip).toFixed(2)
      ).toFixed(2)
      return tipPercentage
    } else {
      return 0
    }
  }

  function taxCalculation() {
    const tax = data.restaurant ? +data.restaurant.tax : 0
    if (tax === 0) {
      return tax.toFixed(2)
    }
    const delivery = isPickedUp ? 0 : deliveryCharges
    const amount = +calculatePrice(delivery, true)
    const taxAmount = ((amount / 100) * tax).toFixed(2)
    return taxAmount
  }

  function calculatePrice(delivery = 0, withDiscount) {
    let itemTotal = 0
    cart.forEach(cartItem => {
      itemTotal += cartItem.price * cartItem.quantity
    })
    if (withDiscount && coupon && coupon.discount) {
      itemTotal = itemTotal - (coupon.discount / 100) * itemTotal
    }
    const deliveryAmount = delivery > 0 ? deliveryCharges : 0
    return (itemTotal + deliveryAmount).toFixed(2)
  }

  function calculateTotal() {
    let total = 0
    // const delivery = isPickedUp ? 0 : deliveryCharges
    total += +calculatePrice()
    total += +taxCalculation()
    // total += +calculateTip()
    return parseFloat(total).toFixed(2)
  }

  function validateOrder() {
    if (!data.restaurant.isAvailable || !isOpen()) {
      showAvailablityMessage()
      return
    }
    if (!cart.length) {
      FlashMessage({
        message: t('validateItems')
      })
      return false
    }
    if (calculatePrice(deliveryCharges, true) < minimumOrder) {
      FlashMessage({
        // message: `The minimum amount of (${configuration.currencySymbol} ${minimumOrder}) for your order has not been reached.`
        message: `(${t(minAmount)}) (${
          configuration.currencySymbol
        } ${minimumOrder}) (${t(forYourOrder)})`
      })
      return false
    }
    if (!location._id) {
      props.navigation.navigate('CartAddress')
      return false
    }
    if (!paymentMethod) {
      FlashMessage({
        message: t('setPaymentMethod')
      })
      return false
    }
    if (profile.phone.length < 1) {
      props.navigation.navigate('Profile', { backScreen: 'Cart' })
      return false
    }
    if (profile.phone.length > 0 && !profile.phoneIsVerified) {
      FlashMessage({
        message: t('numberVerificationAlert')
      })
      props.navigation.navigate('Profile')
      return false
    }
    return true
  }

  function checkPaymentMethod(currency) {
    if (paymentMethod.payment === 'STRIPE') {
      return stripeCurrencies.find(val => val.currency === currency)
    }
    if (paymentMethod.payment === 'PAYPAL') {
      return paypalCurrencies.find(val => val.currency === currency)
    }
    return true
  }

  function transformOrder(cartData) {
    return cartData.map(food => {
      return {
        food: food._id,
        quantity: food.quantity,
        variation: food.variation._id,
        addons: food.addons
          ? food.addons.map(({ _id, options }) => ({
              _id,
              options: options.map(({ _id }) => _id)
            }))
          : [],
        specialInstructions: food.specialInstructions
      }
    })
  }
  async function onPayment() {
    if (checkPaymentMethod(configuration.currency)) {
      const items = transformOrder(cart)
      mutateOrder({
        variables: {
          restaurant: cartRestaurant,
          orderInput: items,
          paymentMethod: paymentMethod.payment,
          couponCode: coupon ? coupon.title : null,
          tipping: +calculateTip(),
          taxationAmount: +taxCalculation(),
          orderDate: orderDate,
          isPickedUp: isPickedUp,
          deliveryCharges: isPickedUp ? 0 : deliveryCharges,
          address: {
            label: location.label,
            deliveryAddress: location.deliveryAddress,
            details: location.details,
            longitude: '' + location.longitude,
            latitude: '' + location.latitude
          }
        }
      })
    } else {
      FlashMessage({
        message: t('paymentNotSupported')
      })
    }
  }

  const isOpen = () => {
    const date = new Date()
    const day = date.getDay()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const todaysTimings = data.restaurant.openingTimes.find(
      o => o.day === DAYS[day]
    )
    const times = todaysTimings.times.filter(
      t =>
        hours >= Number(t.startTime[0]) &&
        minutes >= Number(t.startTime[1]) &&
        hours <= Number(t.endTime[0]) &&
        minutes <= Number(t.endTime[1])
    )

    return times.length > 0
  }

  async function didFocus() {
    const { restaurant } = data
    setSelectedRestaurant(restaurant)
    setMinimumOrder(restaurant.minimumOrder)
    const foods = restaurant.categories.map(c => c.foods.flat()).flat()
    const { addons, options } = restaurant
    try {
      if (cartCount && cart) {
        const transformCart = cart.map(cartItem => {
          const food = foods.find(food => food._id === cartItem._id)
          if (!food) return null
          const variation = food.variations.find(
            variation => variation._id === cartItem.variation._id
          )
          if (!variation) return null

          const title = `${food.title}${
            variation.title ? `(${variation.title})` : ''
          }`
          let price = variation.price
          const optionsTitle = []
          if (cartItem.addons) {
            cartItem.addons.forEach(addon => {
              const cartAddon = addons.find(add => add._id === addon._id)
              if (!cartAddon) return null
              addon.options.forEach(option => {
                const cartOption = options.find(opt => opt._id === option._id)
                if (!cartOption) return null
                price += cartOption.price
                optionsTitle.push(cartOption.title)
              })
            })
          }
          return {
            ...cartItem,
            optionsTitle,
            title: title,
            price: price.toFixed(2)
          }
        })

        if (props.navigation.isFocused()) {
          const updatedItems = transformCart.filter(item => item)
          if (updatedItems.length === 0) await clearCart()
          await updateCart(updatedItems)
          setLoadingData(false)
          if (transformCart.length !== updatedItems.length) {
            FlashMessage({
              message: t('itemNotAvailable')
            })
          }
        }
      } else {
        if (props.navigation.isFocused()) {
          setLoadingData(false)
        }
      }
    } catch (e) {
      FlashMessage({
        message: e.message
      })
    }
  }

  function emptyCart() {
    return (
      <View style={styles().subContainerImage}>
        <View style={styles().imageContainer}>
          <EmptyCart width={scale(200)} height={scale(200)} />
        </View>
        <View style={styles().descriptionEmpty}>
          <TextDefault textColor={currentTheme.fontMainColor} bolder center>
            {t('hungry')}?
          </TextDefault>
          <TextDefault textColor={currentTheme.fontSecondColor} bold center>
            {t('emptyCart')}
          </TextDefault>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles(currentTheme).emptyButton}
          onPress={() =>
            props.navigation.navigate({
              name: 'Main',
              merge: true
            })
          }>
          <TextDefault
            textColor={currentTheme.buttonText}
            bolder
            B700
            center
            uppercase>
            {t('emptyCartBtn')}
          </TextDefault>
        </TouchableOpacity>
      </View>
    )
  }
  function loadginScreen() {
    return (
      <View style={styles(currentTheme).screenBackground}>
        <Placeholder
          Animation={props => (
            <Fade
              {...props}
              style={styles(currentTheme).placeHolderFadeColor}
              duration={600}
            />
          )}
          style={styles(currentTheme).placeHolderContainer}>
          <PlaceholderLine />
          <PlaceholderLine />
          <PlaceholderLine />
        </Placeholder>

        <Placeholder
          Animation={props => (
            <Fade
              {...props}
              style={styles(currentTheme).placeHolderFadeColor}
              duration={600}
            />
          )}
          style={styles(currentTheme).placeHolderContainer}>
          <PlaceholderLine style={styles().height60} />
          <PlaceholderLine />
        </Placeholder>

        <Placeholder
          Animation={props => (
            <Fade
              {...props}
              style={styles(currentTheme).placeHolderFadeColor}
              duration={600}
            />
          )}
          style={styles(currentTheme).placeHolderContainer}>
          <PlaceholderLine style={styles().height100} />
          <PlaceholderLine />
          <PlaceholderLine />
          <View
            style={[
              styles(currentTheme).horizontalLine,
              styles().width100,
              styles().mB10
            ]}
          />
          <PlaceholderLine />
          <PlaceholderLine />
        </Placeholder>
        <Placeholder
          Animation={props => (
            <Fade
              {...props}
              style={styles(currentTheme).placeHolderFadeColor}
              duration={600}
            />
          )}
          style={styles(currentTheme).placeHolderContainer}>
          <PlaceholderLine style={styles().height100} />
          <PlaceholderLine />
          <PlaceholderLine />
          <View
            style={[
              styles(currentTheme).horizontalLine,
              styles().width100,
              styles().mB10
            ]}
          />
          <PlaceholderLine />
          <PlaceholderLine />
        </Placeholder>
      </View>
    )
  }

  function renderRightSwipe(progress, key) {
    const scaleX = progress.interpolate({
      inputRange: [0, 1, 3],
      outputRange: [100, 0, 0]
    })
    return (
      <Animated.View
        style={[
          styles().trashContainer,
          { transform: [{ translateX: scaleX }] }
        ]}>
        <RectButton
          rippleColor="black"
          style={styles().trashIcon}
          onPress={() => deleteItem(key)}>
          <EvilIcons name="trash" size={scale(25)} color={currentTheme.white} />
        </RectButton>
      </Animated.View>
    )
  }
  if (loading || loadingData || loadingTip) return loadginScreen()

  const renderItem = ({ item }) => (
    <View style={{ ...alignment.PRsmall }}>
      <View style={styles().suggestItemContainer}>
        <View style={styles().suggestItemImgContainer}>
          <Image
            source={{
              uri:
                'https://enatega.com/wp-content/uploads/2024/02/burger-removebg-preview-1.png'
            }}
            style={styles().suggestItemImg}
            resizeMode="contain"
          />
        </View>
        <TextDefault
          style={styles().suggestItemName}
          textColor={currentTheme.fontFourthColor}
          H5
          bolder>
          {item.name}
        </TextDefault>
        <TextDefault
          style={styles().suggestItemDesciption}
          textColor={currentTheme.secondaryText}
          normal>
          {item.description}
        </TextDefault>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between'
          }}>
          <TextDefault
            style={styles().suggestItemPrice}
            textColor={currentTheme.fontFourthColor}
            normal
            bolder>
            {item.price}
          </TextDefault>
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Alert', 'Under development')
            }}>
            <View style={styles().addToCart}>
              <MaterialIcons name="add" size={scale(20)} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  return (
    <>
      <View style={styles(currentTheme).mainContainer}>
        {!cart.length && emptyCart()}
        {!!cart.length && (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={[styles().flex, styles().cartItems]}>
              <View style={[styles(currentTheme).headerContainer]}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles().locationContainer}
                  onPress={event => {
                    if (!profile.addresses.length) {
                      props.navigation.navigate('NewAddress', {
                        backScreen: 'Cart'
                      })
                    } else {
                      props.navigation.navigate('CartAddress', {
                        address: location
                      })
                    }
                  }}>
                  <View style={styles().location}>
                    <Location
                      locationIconGray={{
                        backgroundColor: currentTheme.newBorderColor,
                        borderWidth: 1,
                        borderColor: currentTheme.iconBackground,
                        width: 30,
                        height: 30
                      }}
                    />
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={currentTheme.secondaryText}
                  />

                  {/* <View style={[styles().floatView, styles().pB10]}>
                    <TextDefault
                      numberOfLines={1}
                      small
                      bold
                      textColor={currentTheme.darkBgFont}
                      style={{ width: '30%' }}>
                      {t('titleDeliveryDetails')} {' :'}
                    </TextDefault>
                    {location ? (
                      <View style={[styles().addressAllignment]}>
                        <TextDefault
                          small
                          bold
                          textColor={
                            currentTheme.darkBgFont
                          }>{`${location.deliveryAddress}`}</TextDefault>
                        <View style={[styles().addressDetailAllign]}>
                          <TextDefault textColor={currentTheme.darkBgFont}>
                            {' '}
                            {location.details}
                          </TextDefault>
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={props.modalOn}
                            style={styles.textContainer}>
                            <TextDefault
                              textColor={props.linkColor}
                              numberOfLines={1}
                              H5
                              bolder>
                              {''}
                              {truncatedTranslatedAddress}
                            </TextDefault>
                          </TouchableOpacity>
                          <View style={styles().locationIcon}>
                            <EvilIcons
                              name="location"
                              size={20}
                              color="black"
                            />
                          </View>
                        </View>
                      </View>
                    ) : (
                      <TextDefault
                        small
                        textColor={currentTheme.fontSecondColor}>
                        {t('deliveryAddressmessage')}
                      </TextDefault>
                    )}
                  </View> */}
                </TouchableOpacity>
                {/* <View
                  style={[
                    styles(currentTheme).priceContainer,
                    styles().pT10,
                    styles().mB10,
                    styles().pB10
                  ]}>
                  <View style={styles(currentTheme).imageContainer}>
                    <View style={{ marginLeft: scale(10) }}>
                      <Image
                        resizeMode="cover"
                        source={require('../../assets/images/delivery.png')}
                      />
                    </View>
                    <View
                      style={{
                        marginLeft: scale(20)
                      }}>
                      <TextDefault
                        textColor={currentTheme.darkBgFont}
                        style={{ padding: 5 }}
                        bolder>
                        {isPickedUp ? t('pickUp') : t('delivery')}{' '}
                      </TextDefault>
                      <TextDefault
                        textColor={currentTheme.darkBgFont}
                        style={{ padding: 5 }}
                        bold>
                        {`${orderDate.format('MM-D-YYYY, h:mm a')}`}
                      </TextDefault>
                      <TouchableOpacity
                        onPress={onOpen}
                        style={styles(currentTheme).cartInnerContainer}>
                        <TextDefault bold textColor={'white'} center>
                          {t('change')}
                        </TextDefault>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View> */}
              </View>
              <View
                style={{
                  ...alignment.PLsmall,
                  ...alignment.PRsmall,
                  marginTop: 10
                }}>
                <View
                  style={[styles(currentTheme).dealContainer, styles().mB10]}>
                  <TextDefault style={styles().totalOrder} H5 bolder>
                    Your Order ({cartLength})
                  </TextDefault>
                  {cart.map((food, index) => (
                    <View style={[styles(currentTheme).itemContainer]}>
                      <CartItem
                        quantity={food.quantity}
                        dealName={food.title}
                        optionsTitle={food.optionsTitle}
                        dealPrice={(
                          parseFloat(food.price) * food.quantity
                        ).toFixed(2)}
                        addQuantity={() => {
                          addQuantity(food.key)
                        }}
                        removeQuantity={() => {
                          removeQuantity(food.key)
                        }}
                      />
                    </View>
                  ))}
                </View>
                {/* <View
                  style={[
                    styles(currentTheme).priceContainer,
                    styles().pT10,
                    styles().mB10
                  ]}>
                  <View
                    style={[styles().floatView, styles().pB10, styles().pT10]}>
                    <TextDefault
                      numberOfLines={1}
                      large
                      bold
                      textColor={currentTheme.darkBgFont}
                      style={{ width: '30%' }}>
                      {t('subTotal')}
                    </TextDefault>
                    <TextDefault
                      numberOfLines={1}
                      textColor={currentTheme.fontMainColor}
                      large
                      bold
                      style={{ width: '70%' }}
                      right>
                      {configuration.currencySymbol} {calculatePrice(0, false)}
                    </TextDefault>
                  </View>
                  <View
                    style={[
                      styles(currentTheme).horizontalLine,
                      styles().width100,
                      styles().mB10
                    ]}
                  />

                  {!isPickedUp && (
                    <View style={[styles().floatView, styles().pB10]}>
                      <TextDefault
                        numberOfLines={1}
                        textColor={currentTheme.darkBgFont}
                        large
                        bold
                        style={{ width: '30%' }}>
                        {t('deliveryFee')}
                      </TextDefault>
                      <TextDefault
                        numberOfLines={1}
                        textColor={currentTheme.fontMainColor}
                        style={{ width: '70%' }}
                        large
                        bold
                        right>
                        {configuration.currencySymbol}{' '}
                        {deliveryCharges.toFixed(2)}
                      </TextDefault>
                    </View>
                  )}
                  <View
                    style={[
                      styles(currentTheme).horizontalLine,
                      styles().width100,
                      styles().mB10
                    ]}
                  />

                  <View style={[styles().floatView, styles().pB10]}>
                    <TextDefault
                      numberOfLines={1}
                      textColor={currentTheme.darkBgFont}
                      large
                      bold
                      style={{ width: '30%' }}>
                      {t('taxFee')}
                    </TextDefault>
                    <TextDefault
                      numberOfLines={1}
                      textColor={currentTheme.fontMainColor}
                      style={{ width: '70%' }}
                      large
                      bold
                      right>
                      {configuration.currencySymbol} {taxCalculation()}
                    </TextDefault>
                  </View>
                  {!coupon ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles().pB10, styles().width100]}
                      onPress={() => {
                        props.navigation.navigate('Coupon', {
                          paymentMethod,
                          coupon
                        })
                      }}>
                      <TextDefault
                        numberOfLines={1}
                        large
                        bolder
                        textColor={currentTheme.darkBgFont}>
                        {t('haveVoucher')}
                      </TextDefault>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles().floatView, styles().pB10]}>
                      <TextDefault
                        numberOfLines={1}
                        textColor={currentTheme.fontMainColor}
                        small
                        style={{ width: '30%' }}>
                        {coupon ? coupon.title : null}
                      </TextDefault>
                      <View
                        numberOfLines={1}
                        style={[
                          styles().floatText,
                          styles(currentTheme).floatRight,
                          styles().couponContainer
                        ]}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            props.navigation.setParams({ coupon: null })
                          }}>
                          <TextDefault
                            small
                            textColor={currentTheme.buttonBackgroundPink}>
                            {coupon ? t('remove') : null}
                          </TextDefault>
                        </TouchableOpacity>
                        <TextDefault
                          textColor={currentTheme.fontMainColor}
                          bold
                          large>
                          {configuration.currencySymbol}
                          {parseFloat(
                            calculatePrice(0, false) - calculatePrice(0, true)
                          ).toFixed(2)}
                        </TextDefault>
                      </View>
                    </View>
                  )}
                  <View
                    style={[
                      styles(currentTheme).horizontalLine,
                      styles().pB5,
                      styles().width100,
                      styles().mB10
                    ]}
                  />

                  <View
                    style={[
                      styles().floatView,
                      styles().pB10,
                      styles().tipRow
                    ]}>
                    <TextDefault
                      numberOfLines={1}
                      large
                      bold
                      textColor={currentTheme.darkBgFont}
                      style={{ width: '30%' }}>
                      {t('tip')}
                    </TextDefault>
                    <View
                      numberOfLines={1}
                      style={[
                        styles().floatText,
                        styles(currentTheme).floatRight,
                        styles().tipContainer
                      ]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={{ ...alignment.PxSmall }}
                        onPress={() => {
                          setSelectedTip(null)
                          props.navigation.setParams({ tipAmount: null })
                        }}>
                        <TextDefault
                          small
                          bold
                          textColor={currentTheme.darkBgFont}>
                          {tip || selectedTip ? t('remove') : null}
                        </TextDefault>
                      </TouchableOpacity>
                      <TextDefault
                        textColor={currentTheme.fontMainColor}
                        large
                        bold>
                        {configuration.currencySymbol}{' '}
                        {parseFloat(calculateTip()).toFixed(2)}
                      </TextDefault>
                    </View>
                  </View>
                  {dataTip && (
                    <View style={styles().buttonInline}>
                      {dataTip.tips.tipVariations.map((label, index) => (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          key={index}
                          style={[
                            selectedTip === label
                              ? styles(currentTheme).activeLabel
                              : styles(currentTheme).labelButton
                          ]}
                          onPress={() => {
                            props.navigation.setParams({ tipAmount: null })
                            setSelectedTip(label)
                          }}>
                          <TextDefault
                            style={
                              selectedTip === label && {
                                ...textStyles.Bolder
                              }
                            }
                            textColor={
                              selectedTip === label
                                ? currentTheme.black
                                : currentTheme.darkBgFont
                            }
                            small
                            bold
                            center>
                            {label}%
                          </TextDefault>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        style={
                          tip
                            ? styles(currentTheme).activeLabel
                            : styles(currentTheme).labelButton
                        }
                        onPress={() => {
                          props.navigation.navigate('Tip')
                        }}>
                        <TextDefault
                          style={
                            !!tip && {
                              ...textStyles.Bolder
                            }
                          }
                          textColor={
                            tip ? currentTheme.black : currentTheme.darkBgFont
                          }
                          small
                          bold
                          center>
                          {t('Custom')}
                        </TextDefault>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View
                    style={[
                      styles(currentTheme).horizontalLine,
                      styles().pB10,
                      styles().width100,
                      styles().mB10
                    ]}
                  />
                  <View style={[styles().floatView, styles().pB10]}>
                    <TextDefault
                      numberOfLines={1}
                      textColor={currentTheme.fontMainColor}
                      style={{ width: '30%' }}
                      bolder>
                      {t('total')}
                    </TextDefault>
                    <TextDefault
                      numberOfLines={1}
                      textColor={currentTheme.fontMainColor}
                      style={{ width: '70%' }}
                      bolder
                      right>
                      {configuration.currencySymbol}
                      {calculateTotal()}
                    </TextDefault>
                  </View>
                </View> */}

                {/* {isLoggedIn && profile && (
                  <>
                    <View
                      style={[
                        styles(currentTheme).dealContainer,
                        styles().pT10,
                        styles().mB10
                      ]}>
                      <View style={[styles().floatView, styles().pB10]}>
                        <MaterialIcons
                          style={{ marginRight: 10 }}
                          name="place"
                          size={24}
                          color={currentTheme.main}
                        />
                        <TextDefault
                          numberOfLines={1}
                          large
                          bolder
                          textColor={currentTheme.fontMainColor}>
                          {t('contactInfo')}
                        </TextDefault>
                      </View>
                      <View style={[styles().floatView, styles().pB10]}>
                        <TextDefault
                          numberOfLines={1}
                          small
                          bold
                          textColor={currentTheme.darkBgFont}
                          style={{ width: '30%' }}>
                          {t('email')}
                          {' :'}
                        </TextDefault>
                        <TextDefault
                          numberOfLines={1}
                          small
                          bold
                          textColor={currentTheme.darkBgFont}
                          style={{ width: '70%' }}
                          right>
                          {profile.email}
                        </TextDefault>
                      </View>
                      <View style={[styles().floatView, styles().pB10]}>
                        <TextDefault
                          numberOfLines={1}
                          textColor={currentTheme.darkBgFont}
                          small
                          bold
                          style={{ width: '30%' }}>
                          {t('phone')}
                          {' :'}
                        </TextDefault>
                        <TextDefault
                          numberOfLines={1}
                          textColor={currentTheme.darkBgFont}
                          small
                          bold
                          style={{ width: '70%' }}
                          right>
                          {profile.phone ? profile.phone : 'None'}
                        </TextDefault>
                      </View>
                      <View
                        style={[
                          styles(currentTheme).horizontalLine,
                          styles().width100,
                          styles().mB10
                        ]}
                      />
                      {isPickedUp ? (
                        <>
                          <View style={[styles().floatView, styles().pB10]}>
                            <TextDefault
                              numberOfLines={1}
                              textColor={currentTheme.fontSecondColor}
                              small
                              bold
                              style={{ width: '30%' }}>
                              {t('titlePickUpDetails')}
                              {' :'}
                            </TextDefault>
                            <TextDefault
                              small
                              right
                              bold
                              textColor={currentTheme.black}
                              style={{ width: '70%' }}>
                              {`${selectedRestaurant.address}`}
                            </TextDefault>
                          </View>
                          <View style={[styles().width100, styles().mB10]} />
                        </>
                      ) : (
                        <>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles().pB10}
                            onPress={event => {
                              if (!profile.addresses.length) {
                                props.navigation.navigate('NewAddress', {
                                  backScreen: 'Cart'
                                })
                              } else {
                                props.navigation.navigate('CartAddress', {
                                  address: location
                                })
                              }
                            }}>
                            <View style={[styles().floatView, styles().pB10]}>
                              <TextDefault
                                numberOfLines={1}
                                small
                                bold
                                textColor={currentTheme.darkBgFont}
                                style={{ width: '30%' }}>
                                {t('titleDeliveryDetails')} {' :'}
                              </TextDefault>
                              {location ? (
                                <View style={[styles().addressAllignment]}>
                                  <TextDefault
                                    small
                                    bold
                                    right
                                    style={{ width: '65%' }}
                                    textColor={
                                      currentTheme.darkBgFont
                                    }>{`${location.deliveryAddress}`}</TextDefault>
                                  <View style={[styles().addressDetailAllign]}>
                                    <TextDefault
                                      textColor={currentTheme.darkBgFont}>
                                      {' '}
                                      {location.details}
                                    </TextDefault>
                                  </View>
                                </View>
                              ) : (
                                <TextDefault
                                  small
                                  textColor={currentTheme.fontSecondColor}>
                                  {t('deliveryAddressmessage')}
                                </TextDefault>
                              )}
                            </View>
                          </TouchableOpacity>
                          <View style={styles().changeAddressContainer}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={styles(currentTheme).changeAddressBtn}
                              onPress={event => {
                                if (!profile.addresses.length) {
                                  props.navigation.navigate('NewAddress', {
                                    backScreen: 'Cart'
                                  })
                                } else {
                                  props.navigation.navigate('CartAddress', {
                                    address: location
                                  })
                                }
                              }}>
                              <TextDefault bolder small>
                                {' '}
                                {t('changeAddress')}
                              </TextDefault>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                      <View style={[styles().width100, styles().mB10]} />
                    </View>
                    <View
                      style={[
                        styles(currentTheme).dealContainer,
                        styles().pT10,
                        styles().mB10
                      ]}>
                      <View style={[styles().floatView, styles().mB10]}>
                        <MaterialIcons
                          style={{ marginRight: 10 }}
                          name="payment"
                          size={24}
                          color={currentTheme.main}
                        />
                        <TextDefault
                          large
                          bolder
                          textColor={currentTheme.fontMainColor}
                          style={{ width: '60%' }}>
                          {t('paymentMethod')}
                        </TextDefault>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={[styles().width30]}
                          onPress={() => {
                            props.navigation.navigate('Payment', {
                              paymentMethod,
                              coupon
                            })
                          }}>
                          <TextDefault
                            small
                            bolder
                            textColor={currentTheme.darkBgFont}
                            right>
                            {t('change')}
                          </TextDefault>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles().floatView,
                          styles().pB10,
                          styles().pT10
                        ]}
                        onPress={() => {
                          props.navigation.navigate('Payment', {
                            paymentMethod,
                            coupon
                          })
                        }}>
                        <View style={{ width: '10%' }}>
                          <Image
                            resizeMode="cover"
                            style={[
                              styles().iconStyle,
                              { ...alignment.MRxSmall }
                            ]}
                            source={paymentMethod.icon}
                          />
                        </View>
                        <TextDefault
                          textColor={currentTheme.darkBgFont}
                          medium
                          bolder
                          style={{ width: '45%' }}>
                          {paymentMethod.label}
                        </TextDefault>
                        <TextDefault
                          textColor={currentTheme.fontMainColor}
                          style={{ width: '45%' }}
                          large
                          bold
                          right>
                          {configuration.currencySymbol} {calculateTotal()}
                        </TextDefault>
                      </TouchableOpacity>
                    </View>
                  </>
                )} */}
                {/* <View
                  style={[
                    styles(currentTheme).termsContainer,
                    styles().pT10,
                    styles().mB10
                  ]}>
                  <TextDefault
                    textColor={currentTheme.fontMainColor}
                    style={alignment.MBsmall}
                    small>
                    {t('condition1')}
                  </TextDefault>
                  <TextDefault
                    textColor={currentTheme.fontSecondColor}
                    style={alignment.MBsmall}
                    small
                    bold>
                    {t('condition2')}
                  </TextDefault>
                </View> */}
              </View>
              <View style={styles().suggestedItems}>
                <TextDefault
                  style={styles().suggestItemDesciption}
                  textColor={currentTheme.fontNewColor}
                  H5
                  bolder>
                  Would you like to add these?
                </TextDefault>
                <FlatList
                  data={dataItems}
                  renderItem={renderItem}
                  keyExtractor={item => item.id}
                  contentContainerStyle={{ flexGrow: 1, ...alignment.PRlarge }}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  horizontal={true}
                />
              </View>
            </ScrollView>

            {!isModalOpen && (
              <View style={styles().totalBillContainer}>
                <View style={styles(currentTheme).buttonContainer}>
                  <View>
                    <TextDefault
                      textColor={currentTheme.black}
                      style={styles().totalBill}
                      bolder
                      H2>
                      {configuration.currencySymbol}
                      {calculateTotal()}
                    </TextDefault>
                    <TextDefault
                      textColor={currentTheme.black}
                      style={styles().totalBill}
                      bolder
                      Smaller>
                      Total is inclusive of VAT
                    </TextDefault>
                    {/* <View style={styles().buttontLeft}>
                      <View style={styles(currentTheme).buttonLeftCircle}>
                        <TextDefault
                          bolder
                          center
                          textColor={currentTheme.white}
                          smaller>
                          {cartCount}
                        </TextDefault>
                      </View>
                    </View> */}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      navigation.navigate('Checkout')
                    }}
                    style={styles(currentTheme).button}>
                    <TextDefault
                      textColor={currentTheme.themeBackground}
                      style={styles().checkoutBtn}
                      bold
                      H5>
                      {t('checkoutBtn')}
                    </TextDefault>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </>
  )
}

export default Cart

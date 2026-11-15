"""Café register: take orders against a starting stock of 10 per item."""

STARTING_STOCK = 10

menu_items = {
    "cappuccino": 5.00,
    "latte": 4.50,
    "espresso": 3.00,
    "americano": 3.00,
    "sandwich": 7.50,
}

stock = {item: STARTING_STOCK for item in menu_items}


def show_menu() -> None:
    """Print each item with its number, price, and how many are left."""
    print("Available menu items:")
    for number, (item, price) in enumerate(menu_items.items(), start=1):
        print(f"{number}. {item}: ${price:.2f} ({stock[item]} left)")


def read_item_choice() -> str:
    """Return the item for the number entered."""
    raw_choice = input("Enter item number: ").strip().lower()
    if not raw_choice.isdigit():
        print("Please enter the number next to the item.")
        return ""
    item_names = list(menu_items)
    item_number = int(raw_choice)
    if item_number < 1 or item_number > len(item_names):
        print("That number is not on the menu.")
        return ""
    return item_names[item_number - 1]


def read_quantity(item_name: str) -> int | None:
    """Read a quantity that is a positive whole number and still in stock."""
    try:
        quantity = int(input("Enter quantity: "))
    except ValueError:
        print("Please enter a valid whole number.")
        return None
    if quantity <= 0:
        print("Please enter a positive quantity.")
        return None
    available = stock[item_name]
    if quantity > available:
        print(f"Only {available} {item_name}(s) left.")
        return None
    return quantity


def wants_more_items() -> bool:
    """Ask whether to add another item. 1 means yes and 2 means no."""
    while True:
        print("Do you want to add more items?")
        print("1) Yes")
        print("2) No")
        choice = input("Enter your choice: ").strip()
        if choice == "1":
            return True
        if choice == "2":
            return False
        print("Please enter 1 for yes or 2 for no.")


def take_order() -> None:
    """Take one customer's order and reduce stock for each line that sells."""
    customer_name = input("Enter Customer Name: ").strip()
    print(f"Welcome to our café, {customer_name}!")
    lines: list[tuple[str, int, float]] = []
    order_total = 0.0
    while True:
        show_menu()
        item_name = read_item_choice()
        if item_name == "":
            continue
        if stock[item_name] == 0:
            print(f"Sorry, {item_name} is sold out.")
            continue
        quantity = read_quantity(item_name)
        if quantity is None:
            continue
        line_cost = menu_items[item_name] * quantity
        stock[item_name] -= quantity
        order_total += line_cost
        lines.append((item_name, quantity, line_cost))
        print(
            f"Added {quantity} unit(s) of {item_name}. "
            f"Line total: ${line_cost:.2f}. {stock[item_name]} left."
        )
        if not wants_more_items():
            break
    if not lines:
        print("No items ordered.")
        return
    print(f"Receipt for {customer_name}:")
    for item_name, quantity, line_cost in lines:
        print(f"  {quantity} x {item_name}: ${line_cost:.2f}")
    print(f"Total cost: ${order_total:.2f}")


def show_stock() -> None:
    """Print how many of each item remain."""
    print("Stock on hand:")
    for item, remaining in stock.items():
        print(f"  {item}: {remaining}")


def main() -> None:
    """Keep the register open until the cashier closes it."""
    print("Register open. Every item starts with 10 in stock.")
    show_stock()
    while True:
        take_order()
        show_stock()
        another = input("Serve another customer? (yes/no): ").lower().strip()
        if another != "yes":
            print("Register closed.")
            break


if __name__ == "__main__":
    main()
